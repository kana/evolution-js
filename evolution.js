(function () {
  var MAP = {x: 0, y: 0, width: 100, height: 30};
  var JUNGLE = {x: 45, y: 10, width: 10, height: 10};
  var PLANET_ENERGY = 80;
  var REPRODUCTION_ENERGY = 200;

  var plants = {};  // (x, y) -> t

  function random(n) {
    return Math.floor(Math.random() * n);
  }

  function random_plant(left, top, width, height) {
    var position = [left + random(width), top + random(height)];
    plants[position] = true;
  }
  function add_plants() {
    random_plant(JUNGLE.x, JUNGLE.y, JUNGLE.width, JUNGLE.height);
    random_plant(MAP.x, MAP.y, MAP.width, MAP.height);
  }

  var animals = [
    {
      x: MAP.width >> 1,
      y: MAP.height >> 1,
      energy: 1000,
      dir: 0,
      genes: $.map(new Array(8), function () {return random(10) + 1;})
    }
  ];

  var DX_FROM_DIR = {
    0: -1,
    1: 0,
    2: 1,
    3: 1,
    4: 1,
    5: 0,
    6: -1,
    7: -1,
  };
  var DY_FROM_DIR = {
    0: -1,
    1: -1,
    2: -1,
    3: 0,
    4: 1,
    5: 1,
    6: 1,
    7: 0,
  };
  function move(animal) {
    animal.x = (animal.x + DX_FROM_DIR[animal.dir] + MAP.width) % MAP.width;
    animal.y = (animal.y + DY_FROM_DIR[animal.dir] + MAP.height) % MAP.height;
    animal.energy--;
  }

  function turn(animal) {
    var n = random(animal.genes.reduce(function (acc, g) {return acc + g;}));
    var ddir = 0;
    for (var i = 0; i < animal.genes.length; i++) {
      n -= animal.genes[i];
      if (n < 0)
        break;
      ddir++;
    }
    animal.dir = (animal.dir + ddir) % 8;
  }

  function eat(animal) {
    var position = [animal.x, animal.y];
    if (plants[position]) {
      animal.energy += PLANET_ENERGY;
      delete plants[position];
    }
  }

  function reproduce(animal) {
    var e = animal.energy;
    if (e < REPRODUCTION_ENERGY)
      return;

    animal.energy = e >> 1;
    var child = $.extend({}, animal);
    var genes = $.extend([], animal.genes);
    var mutation = random(8);
    genes[mutation] = Math.max(1, genes[mutation] + random(3) - 1);
    child.genes = genes;
    animals.push(child);
  }

  function updateWorld() {
    animals = animals.filter(function (a) {return 0 < a.energy;});
    animals.forEach(function (a) {
      turn(a);
      move(a);
      eat(a);
      reproduce(a);
    });
    add_plants();
  }

  function drawWorld() {
    var cs = [];
    for (var y = MAP.y; y < MAP.height; y++) {
      for (var x = MAP.x; x < MAP.width; x++) {
        cs.push(
          animals.some(function (a) {return a.x == x && a.y == y;}) ? 'M' : 
          plants[[x, y]] ? '*' :
          ' '
        );
      }
      cs.push('\n');
    }
    $('#game_board').text(cs.join(''));
  }
})();
// vim: expandtab softtabstop=2 shiftwidth=2
