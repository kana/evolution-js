(function () {
  var MAP = {x: 0, y: 0, width: 100, height: 30};
  var JUNGLE = {x: 45, y: 10, width: 10, height: 10};
  var PLANET_ENERGY = 80;

  var plants = {};  // (x, y) -> t

  function random(n) {
    return Math.floor(Math.random() * n);
  }

  function random_plant(left, top, width, height) {
    var position = [left + random(width), top + random(height)];
    plants[position] = true;
  }
})();
// vim: expandtab softtabstop=2 shiftwidth=2
