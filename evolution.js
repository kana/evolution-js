(function () {
  var config = {
    map_x: 0,
    map_y: 0,
    map_width: 100,
    map_height: 30,
    jungle_x: 45,
    jungle_y: 10,
    jungle_width: 10,
    jungle_height: 10,
    plant_energy: 80,
    reproduction_energy: 200,
    automatic_skipping_interval_ms: 1000,
  };

  var plants;  // (x, y) -> t
  var isDebugging = false;
  var automaticSkippingId = undefined;
  var currentDay;  // Int
  var animals;  // [Animal]

  function random(n) {
    return Math.floor(Math.random() * n);
  }

  function random_plant(left, top, width, height) {
    var position = [left + random(width), top + random(height)];
    plants[position] = true;
  }
  function add_plants() {
    random_plant(config.jungle_x, config.jungle_y,
                 config.jungle_width, config.jungle_height);
    random_plant(config.map_x, config.map_y,
                 config.map_width, config.map_height);
  }

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
    animal.x = (animal.x + DX_FROM_DIR[animal.dir] + config.map_width)
               % config.map_width;
    animal.y = (animal.y + DY_FROM_DIR[animal.dir] + config.map_height)
               % config.map_height;
    animal.energy--;
    animal.age++;
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
      animal.energy += config.plant_energy;
      delete plants[position];
    }
  }

  function reproduce(animal) {
    var e = animal.energy;
    if (e < config.reproduction_energy)
      return;

    animal.energy = e >> 1;
    var child = $.extend({}, animal);
    var genes = $.extend([], animal.genes);
    var mutation = random(8);
    genes[mutation] = Math.max(1, genes[mutation] + random(3) - 1);
    child.genes = genes;
    child.age = 0;
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
    currentDay++;
  }

  var ANIMAL_SYMBOLS = '.cohbHNM';
  function symbolizeAnimalByEnergy(a) {
    var step = config.reproduction_energy / ANIMAL_SYMBOLS.length;
    var si = Math.min(Math.round(a.energy / step), ANIMAL_SYMBOLS.length - 1);
    return ANIMAL_SYMBOLS[si];
  }
  function symbolizeAnimalByAge(a, maxAge) {
    var step = maxAge / ANIMAL_SYMBOLS.length;
    var si = Math.min(Math.round(a.age / step), ANIMAL_SYMBOLS.length - 1);
    return ANIMAL_SYMBOLS[si];
  }

  var ANIMAL_COLORS = [
    [255,   0,   0],
    [255, 191,   0],
    [128, 255,   0],
    [  0, 255,  64],
    [  0, 255, 255],
    [  0,  64, 255],
    [128,   0, 255],
    [255,   0, 191]
  ];
  function colorAnimal(a) {
    var factor = 1 / a.genes.reduce(function (acc, g) {return acc + g;});
    function pick(ci) {
      return Math.round(
        Math.min(
          255,
          a.genes.map(function (g, i) {
            return g * ANIMAL_COLORS[i][ci] * factor;
          }).reduce(function (r, c) {
            return r + c;
          })
        )
      );
    }
    return 'rgb(' + pick(0) + ',' + pick(1) + ',' + pick(2) + ')';
  }

  function colorPlant(p) {
    return 'rgb(0,204,0)';
  }

  function drawWorld() {
    var atable = {};
    var maxAge = 0;
    animals.forEach(function (a) {
      atable[[a.x, a.y]] = a;
      maxAge = Math.max(a.age, maxAge);
    });

    var cs = [];
    for (var y = config.map_y; y < config.map_height; y++) {
      for (var x = config.map_x; x < config.map_width; x++) {
        var a = atable[[x, y]];
        var p = plants[[x, y]];
        var color =
          a ? colorAnimal(a) :
          p ? colorPlant(p) :
          'transparent';
        cs.push(
          '<span style="color: ' + color + '">' + (
            a ? symbolizeAnimalByEnergy(a, maxAge) :
            p ? '*' :
            ' '
          ) + '</span>'
        );
      }
      cs.push('\n');
    }

    $('#game_board').html($(cs.join('')));
    $('#currentDay').text(currentDay);
  }

  function updateDebugInformation() {
    $('#debug_animals').text(
      animals.map(function (a) {
        return 'x: ' + a.x + ', ' +
               'y: ' + a.y + ', ' +
               'energy: ' + a.energy + ', ' +
               'dir: ' + a.dir + ', ' +
               'genes: ' + a.genes.toString() + ', ' +
               'age: ' + a.age + '\n';
      }).join('')
    );
    $('#debug_plants').text(
      $.map(plants, function (t, position) {
        return position + '\n';
      }).join('')
    );
  }

  function skipDays(n) {
    for (var i = 0; i < n; i++)
      updateWorld();
    drawWorld();
    if (isDebugging)
      updateDebugInformation();
  }

  function resetWorld() {
    plants = {};
    currentDay = 0;
    animals = [
      {
        x: config.map_width >> 1,
        y: config.map_height >> 1,
        energy: 1000,
        dir: 0,
        genes: $.map(new Array(8), function () {return random(10) + 1;}),
        age: 0
      }
    ];
    drawWorld();
  }

  $('#skip').click(function () {
    var n = parseInt($('#skip_day_count').val());
    if (isNaN(n)) {
      $('#skip_day_count').val('0');
      return;
    }
    skipDays(n);
  });

  $('#toggle_debug_information').click(function () {
    isDebugging = !isDebugging;
    $(this).text((isDebugging ? 'Hide' : 'Show') + ' debug information');
    $('#debug').toggle(isDebugging);
    if (isDebugging)
      updateDebugInformation();
  });

  $('#automatic_skip').change(function () {
    var isEnabled = $(this).filter(':checked').length != 0;
    if (isEnabled) {
      automaticSkippingId = setInterval(
        function () {
          $('#skip').click();
        },
        config.automatic_skipping_interval_ms
      );
    } else {
      if (automaticSkippingId !== undefined)
        clearInterval(automaticSkippingId);
    }
  });

  $('#reset_world').click(function () {
    resetWorld();
  });

  function setUpConfigForm(key) {
    $('#' + key).
      val(config[key]).
      change(function () {
        var n = parseInt($(this).val());
        if (isNaN(n)) {
          $(this).val(config[key]);
          return;
        }
        config[key] = n;
      });
  }
  $.map(config, function (_, key) {setUpConfigForm(key);});

  $(document).ready(function () {
    resetWorld();
    $('#debug').toggle(isDebugging);
  });
})();
// vim: expandtab softtabstop=2 shiftwidth=2
