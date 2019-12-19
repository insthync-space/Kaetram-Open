/* global module */

let _ = require('underscore'),
    ShopData = require('../util/shops'),
    Items = require('../util/items'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets');

class Shops {

    constructor(world) {
        let self = this;

        self.world = world;

        self.interval = 60000;
        self.shopInterval = null;

        self.load();
    }

    load() {
        let self = this;

        self.shopInterval = setInterval(() => {

            _.each(ShopData.Data, (info) => {

                for (let i = 0; i < info.count; i++)
                    if (info.count[i] < info.originalCount[i])
                        ShopData.increment(info.id, info.items[i], 1);

            });

        }, self.interval);
    }

    open(player, npcId) {
        let self = this;

        player.send(new Messages.Shop(Packets.ShopOpcode.Open, {
            instance: player.instance,
            npcId: npcId,
            shopData: self.getShopData(npcId)
        }));

    }

    buy(player, npcId, buyId, count) {
        let self = this,
            cost = ShopData.getCost(npcId, buyId, count),
            currency = self.getCurrency(npcId),
            stock = ShopData.getStock(npcId, buyId);

        if (!cost || !currency || !stock) {
            log.info('Invalid shop data.');
            return;
        }

        //TODO: Make it so that when you have the exact coin count, it removes coins and replaces it with the item purchased.

        if (stock === 0) {
            player.notify('This item is currently out of stock.');
            return;
        }

        if (!player.inventory.contains(currency, cost)) {
            player.notify('You do not have enough money to purchase this.');
            return;
        }

        if (!player.inventory.hasSpace()) {
            player.notify('You do not have enough space in your inventory.');
            return;
        }

        if (count > stock)
            count = stock;

        player.inventory.remove(currency, cost);
        player.inventory.add({
            id: ShopData.getItem(npcId, buyId),
            count: count,
            ability: -1,
            abilityLevel: -1
        });

        ShopData.decrement(npcId, buyId, count);

        self.refresh(npcId);
    }

    sell(player, npcId, slotId) {
        let self = this,
            item = player.inventory.slots[slotId],
            shop = ShopData.Ids[npcId];

        if (!shop || !npcId || item.id < 1) {
            log.info('Invalid shop data.');
            return;
        }

        if (shop.items.indexOf(item.id) < 0) {
            player.notify('That item cannot be sold in this store.');
            return;
        }

    }

    refresh(shop) {
        let self = this;

        self.world.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Shop(Packets.ShopOpcode.Refresh, self.getShopData(shop))
        });
    }

    getCurrency(npcId) {
        let shop = ShopData.Ids[npcId];

        if (!shop)
            return null;

        return shop.currency;
    }

    getSellPrice(npcId, itemId) {
        let shop = ShopData.Ids[npcId];

        if (!shop)
            return 1;

        return Math.floor(shop.getCost(npcId, itemId, 1) / 2);
    }

    getShopData(npcId) {
        let self = this,
            strings = [],
            names = [],
            items = ShopData.getItems(npcId);

        for (let i = 0; i < items.length; i++) {
            strings.push(Items.idToString(items[i]));
            names.push(Items.idToName(items[i]));
        }

        return {
            id: npcId,
            strings: strings,
            names: names,
            counts: ShopData.getCount(npcId)
        }
    }

}

module.exports = Shops;
