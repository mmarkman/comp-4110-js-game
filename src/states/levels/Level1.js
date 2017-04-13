import Phaser from 'phaser'
import Player from '../../sprites/Player'
import { health } from '../../ui/health'
import { xp } from '../../ui/xp'
import { pause } from '../../ui/pause'

export default class extends Phaser.State {
  init () {
  }
  preload () {
    this.load.tilemap('level1map', 'assets/maps/prototype_entry.json', null, Phaser.Tilemap.TILED_JSON)
    this.load.image('pizza', 'assets/images/pizza-1.png')
    this.load.image('columns_set', 'assets/maps/tilesets/columns.png')
    this.load.image('util_set', 'assets/maps/tilesets/util.png')
  }
  create () {
    this.tileWidth = 48
    this.setupTileMap()
    health.addHealthToLevel(this)
    xp.addXPToLevel(this)
    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    var escKey = this.input.keyboard.addKey(Phaser.Keyboard.ESC)
    escKey.onDown.add(this.togglePause, this)
  }

  setupTileMap () {
      //  The 'tavern' key here is the Loader key given in game.load.tilemap
    let map = this.game.add.tilemap('level1map')
  // store a reference so we can access it elsewhere on this class
    this.map = map

  // The first parameter is the tileset name, as specified in the Tiled map editor (and in the tilemap json file)
  // The second parameter maps this name to the Phaser.Cache key 'tiles'
    map.addTilesetImage('columns_combined', 'columns_set')
    map.addTilesetImage('util_tiles', 'util_set')

  // create the base layer, these are the floors, walls
  // and anything else we want behind any sprites
    map.createLayer('Ground')
    map.createLayer('Columns')

  // next create the collision layer
    this.collisionLayer = map.createLayer('Collision')

  // we don't want the collision layer to be visible
    this.collisionLayer.visible = false

  // inform phaser that our collision layer is our collision tiles
  // in our case, since we separated out the collision tiles into its own layer
  // we pass an empty array and passing in true to enable collision
    map.setCollisionByExclusion([], true, this.collisionLayer)

  //  This resizes the game world to match the layer dimensions
    this.collisionLayer.resizeWorld()

  // we will have to initialize our player here
  // so it's sprite will show between the base and foreground tiles
    this.initPlayer()

  // creating the foreground layer last after all moving sprites
  // ensures that this layer will stay above during depth sorting
    // map.createLayer('Foreground')

  // pull the exit area from the object layer
  // we will be using this one during update to check if our player has moved into the exit area
    let exit = this.map.objects.metadata.find(o => o.name === 'exit')
    this.exitRect = new Phaser.Rectangle(exit.x, exit.y, exit.width, exit.height)
  }

  initPlayer () {
    this.player = new Player({
      game: this.game,
      x: this.world.centerX,
      y: this.world.centerY,
      asset: 'player_sprite',
      tileX: 2,
      tileY: 4
    })
    this.game.add.existing(this.player)
  }
    
  togglePause() {
    this.game.physics.arcade.isPaused = (this.game.physics.arcade.isPaused) ? false : true;
    if(this.game.physics.arcade.isPaused){
      pause.displayPauseScreen(this.game)
    }else{
      pause.removePauseScreen(this.game)
    }
  }
    
  render () {
    // useless time-waster right here... physics MUST be called in update ()
  }

  update () {
    this.game.physics.arcade.collide(this.player, this.collisionLayer)

    if (Phaser.Rectangle.containsPoint(this.exitRect, this.player.position)) {
      this.resetPlayer()
    }
  }

  resetPlayer () {
    xp.increaseBy(1)
    this.player.tileX = 2
    this.player.tileY = 4
    this.player.position.set(this.player.tileX * this.tileWidth, this.player.tileY * this.tileWidth)
  }
}