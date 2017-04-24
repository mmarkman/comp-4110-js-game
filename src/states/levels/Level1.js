import Phaser from 'phaser'
import Player from '../../sprites/Player'
import { pause } from '../../ui/pause'
import { health } from '../../ui/health'
import { xp } from '../../ui/xp'

import { FatClown } from '../../sprites/FatClown'
import { ClownBoss } from '../../sprites/ClownBoss'
import { SkinnyClown } from '../../sprites/SkinnyClown'
import { StrongClown } from '../../sprites/StrongClown'

import Weapon from '../../ui/item'
import { Item } from '../../ui/item'
import { Wearable } from '../../ui/item'

export default class extends Phaser.State {

  init () {
  }

  preload () {
    this.load.tilemap('level1map', 'assets/maps/entry_pretty.json', null, Phaser.Tilemap.TILED_JSON)
    this.load.image('tiles', 'assets/maps/tilesets/pretty.png')
    this.load.image('basic-sword', 'assets/spritesheets/items/equipment/basic-sword.png')
    this.load.audio('circus_melody', 'assets/audio/circus_melody.wav')
  }

  create () {

    this.soundtrack = game.add.audio('circus_melody')
    this.soundtrack.loop = true
    this.soundtrack.volume = 0.5
    this.soundtrack.play()

    this.game.tileWidth = this.tileWidth = 48
    this.setupTileMap()
    this.sword
    this.itemGroup = this.game.add.group()
    health.addHealthToLevel(this)
    xp.addXPToLevel(this)
    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    var escKey = this.input.keyboard.addKey(Phaser.Keyboard.P)
    escKey.onDown.add(this.togglePause, this)

  }

  update () {

    this.game.physics.arcade.collide(this.player, this.collisionLayer)
    this.game.physics.arcade.collide(this.player, this.sword)

    // if (!this.player.dodging) {
    //   // Player collide with enemies.
    //   for (var i = 0; i < this.enemies.length; i++) {
    //     this.game.physics.arcade.collide(this.player, this.enemies[i])
    //   }
    // }

    for (var i = 0; i < this.enemies.length; i++) {

      // Enemies collide with walls
      this.game.physics.arcade.collide(this.enemies[i], this.collisionLayer)

      // Enemies collide with each other.
      for (var j = i; j < this.enemies.length; j++) {
        this.game.physics.arcade.collide(this.enemies[j], this.enemies[i])
      }
    }


    if (Phaser.Rectangle.containsPoint(this.exitRect_1, this.player.position)) {
      this.resetPlayer()
    }

    if (Phaser.Rectangle.containsPoint(this.exitRect_2, this.player.position)) {
      this.resetPlayer()
    }

    if (Phaser.Rectangle.containsPoint(this.fenceRect_1, this.player.position)) {
      this.player.can_move = false
    }

    // Item collision detection
    this.sword.body.onCollide.add(this.moveSwordToInventory, this)

  }

  setupTileMap () {

    //  The 'tavern' key here is the Loader key given in game.load.tilemap
    let map = this.game.add.tilemap('level1map')
    // store a reference so we can access it elsewhere on this class
    this.map = map

    // The first parameter is the tileset name, as specified in the Tiled map editor (and in the tilemap json file)
    // The second parameter maps this name to the Phaser.Cache key 'tiles'
    // map.addTilesetImage('columns_combined', 'columns_set')
    //  map.addTilesetImage('util_tiles', 'util_set')
    map.addTilesetImage('pretty', 'tiles')

    // create the base layer, these are the floors, walls
    // and anything else we want behind any sprites
    map.createLayer('Grass')
    map.createLayer('Collision_tiles')

    // map.createLayer('Collision_tiles')
    // map.createLayer('Columns')

    // next create the collision layer
    this.collisionLayer = map.createLayer('Collision')
    this.game.collisionLayer = this.collisionLayer

    // we don't want the collision layer to be visible
    this.collisionLayer.visible = false

    // inform phaser that our collision layer is our collision tiles
    // in our case, since we separated out the collision tiles into its own layer
    // we pass an empty array and passing in true to enable collision
    map.setCollisionByExclusion([], true, this.collisionLayer)

    // This resizes the game world to match the layer dimensions
    this.collisionLayer.resizeWorld()

    // Item init
    var sword = new Item({
        game: this.game,
        x: 150,
        y: 150,
        asset: 'basic-sword',
        player: this.player,
        itemId: 0,
        stats_flat: [0,5,0],
        stats_per: [0,0,0]
    })
    this.sword = sword
    this.game.physics.enable(this.sword, Phaser.Physics.ARCADE)
    this.sword.body.onCollide = new Phaser.Signal()
    this.game.add.existing(this.sword)

    // we will have to initialize our player here
    // so it's sprite will show between the base and foreground tiles
    this.initPlayer()

    // initialize enemy
    this.initEnemy()

    // creating the foreground layer last after all moving sprites
    // ensures that this layer will stay above during depth sorting
    // map.createLayer('Foreground')

    // pull the exit area from the object layer
    // we will be using this one during update to check if our player has moved into the exit area
    let exit_1 = this.map.objects.metadata.find(o => o.name === 'exit_1')
    this.exitRect_1 = new Phaser.Rectangle(exit_1.x, exit_1.y, exit_1.width, exit_1.height)

    let exit_2 = this.map.objects.metadata.find(o => o.name === 'exit_2')
    this.exitRect_2 = new Phaser.Rectangle(exit_2.x, exit_2.y, exit_2.width, exit_2.height)

    let fence_1 = this.map.objects.metadata.find(o => o.name === 'fence_1')
    this.fenceRect_1 = new Phaser.Rectangle(fence_1.x, fence_1.y, fence_1.width, fence_1.height)

    let fence_2 = this.map.objects.metadata.find(o => o.name === 'fence_2')
    this.fenceRect_2 = new Phaser.Rectangle(fence_2.x, fence_2.y, fence_2.width, fence_2.height)

    let fence_3 = this.map.objects.metadata.find(o => o.name === 'fence_3')
    this.fenceRect_3 = new Phaser.Rectangle(fence_3.x, fence_3.y, fence_3.width, fence_3.height)

    let fence_4 = this.map.objects.metadata.find(o => o.name === 'fence_4')
    this.fenceRect_4 = new Phaser.Rectangle(fence_4.x, fence_4.y, fence_4.width, fence_4.height)

    // let exit_2 = this.map.objects.metadata.find(o => o.name === 'exit_2')
    //  this.exitRect = new Phaser.Rectangle(exit.x, exit.y, exit.width, exit.height)

    //  let exit = this.map.objects.metadata.find(o => o.name === 'exit')
    // this.exitRect = new Phaser.Rectangle(exit.x, exit.y, exit.width, exit.height)
  }

  initPlayer () {
    this.game.player = this.player = new Player({
      game: this.game,
      x: this.world.centerX,
      y: this.world.centerY,
      asset: 'player_sprite',
      tileX: 2,
      tileY: 4
    })

    this.game.add.existing(this.player)
  }

  togglePause () {
    this.game.physics.arcade.isPaused = !(this.game.physics.arcade.isPaused)
    if (this.game.physics.arcade.isPaused) {
      pause.displayPauseScreen(this.game)
    } else {
      pause.removePauseScreen(this.game)
    }
  }

  render () {
    // useless time-waster right here... physics MUST be called in update ()
  }

  initEnemy () {
    var enemies = []
    var e

    e = new StrongClown(this.game, 5, 5, 5)
    enemies.push(e)

    e = new FatClown(this.game, 1, 1, 1)
    enemies.push(e)

    e = new SkinnyClown(this.game, 3, 3, 3)
    enemies.push(e)

    e = new ClownBoss(this.game, 7, 7, 7)
    enemies.push(e)

    this.enemies = enemies
  }

  resetPlayer () {
    xp.increaseBy(1)
    this.player.tileX = 8
    this.player.tileY = 4.5
    this.player.position.set(this.player.tileX * this.tileWidth, this.player.tileY * this.tileWidth)
  }

  stopPlayer () {
    this.player.velocity.x = 0
    this.player.velocity.y = 0
  }

  moveSwordToInventory() {
      this.sword.collected()
      this.sword.x = 100
      this.sword.y = 500
      this.sword.body.velocity.x = 0
      this.sword.body.velocity.y = 0
  }

}
