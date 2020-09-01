import _ from 'lodash';
import $ from 'jquery';
import log from '../lib/log';
import spriteData from '../../data/sprites.json';
import Sprite, { SpriteData } from '../entity/sprite';
import Animation from '../entity/animation';
import Renderer from '../renderer/renderer';

export default class SpritesController {
    renderer: Renderer;
    sprites: { [id: string]: Sprite };
    sparksAnimation: Animation;
    loadedSpritesCallback;
    constructor(renderer: Renderer) {
        this.renderer = renderer;

        this.sprites = {};

        this.sparksAnimation = null;

        this.load(spriteData);

        this.loadAnimations();
    }

    load(spriteData: SpriteData[]): void {
        _.each(spriteData, (sprite) => {
            this.sprites[sprite.id] = new Sprite(sprite);
        });

        if (this.renderer.game.isDebug()) log.info('Finished loading sprite data...');

        this.loadedSpritesCallback?.();
    }

    loadAnimations(): void {
        this.sparksAnimation = new Animation('idle_down', 6, 0, 16, 16);
        this.sparksAnimation.setSpeed(120);
    }

    updateSprites(): void {
        _.each(this.sprites, (sprite) => {
            sprite.update();
        });

        if (this.renderer.game.isDebug()) log.info('Sprites updated upon scaling.');
    }

    onLoadedSprites(callback: () => void): void {
        this.loadedSpritesCallback = callback;
    }
}
