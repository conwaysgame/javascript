function createFakeWorld(width, livingCells, deadCells) {
  var fakeWorld = new Array(width);
  for(var i = 0; i < width; i += 1) {
    fakeWorld[i] = [];
  }

  for (cell in livingCells) {
    fakeWorld[livingCells[cell][0]][livingCells[cell][1]] = true;
  }

  for (cell in deadCells) {
    fakeWorld[deadCells[cell][0]][deadCells[cell][1]] = false;
  }

  return fakeWorld;
}

describe("GameOfLife", function() {
  var gameOfLife;

  beforeEach(function() {
    gameOfLife = GameOfLife(4, 4);
  });

  it("should be able to populate a cell", function() {
    gameOfLife.populateCell(0, 3);
    gameOfLife.populateCell(2, 3);
    expect(gameOfLife.get_world()[0][3]).toEqual(true);
    expect(gameOfLife.get_world()[2][3]).toEqual(true);
  });

  it("should be able to populate a few cells at once", function() {
    gameOfLife.populateCells([[0, 3], [2, 3], [3, 3]]);
    expect(gameOfLife.get_world()[0][3]).toEqual(true);
    expect(gameOfLife.get_world()[2][3]).toEqual(true);
    expect(gameOfLife.get_world()[3][3]).toEqual(true);
  });

  it("should be able to toggle a cell", function() {
    gameOfLife.populateCell(0, 3);
    gameOfLife.toggleCell(0, 3);
    expect(gameOfLife.get_world()[0][3]).toEqual(false);
  });

  it("should execute the callback when a cell is populated", function() {
    var cellPopulated = [-1, -1];

    gameOfLife.onCellPopulated(function(x, y) {
      cellPopulated = [x, y];
    });

    gameOfLife.populateCell(0, 3);
    expect(gameOfLife.get_world()[0][3]).toEqual(true);
    expect(cellPopulated).toEqual([0, 3]);
  });

  it("should execute the callback when a cell is killed by toggle", function() {
    var cellKilled = [-1, -1];

    gameOfLife.onCellKilled(function(x, y) {
      cellKilled = [x, y];
    });

    gameOfLife.populateCell(0, 3);
    gameOfLife.toggleCell(0, 3);
    expect(gameOfLife.get_world()[0][3]).toEqual(false);
    expect(cellKilled).toEqual([0, 3]);
  });

  it("should not be able to populate a non-existant cell", function() {
    expect(function() { gameOfLife.populateCell(0, 5) }).toThrow({
      name : 'OutOfBoundsError',
      message : 'There is no such position in the world as [0,5]'
    });
  });

  describe("a world where a live cell has fewer than two live neighbours", function() {
    beforeEach(function() {
      gameOfLife.populateCell(0, 0);
    });

    it("should kill the sole live cell", function() {
      gameOfLife.step();
      expect(gameOfLife.get_world()[0][0]).toEqual(false);
    });
  });

  describe("a world where a live cell has exactly two living neighbours", function() {
    beforeEach(function() {
      gameOfLife.populateCell(1, 1);
      gameOfLife.populateCell(2, 1);
      gameOfLife.populateCell(3, 1);
      gameOfLife.step();
    });

    it("should kill the living peripheral cells", function() {
      expect(gameOfLife.get_world()[1][1]).toEqual(false);
      expect(gameOfLife.get_world()[2][1]).toEqual(true);
      expect(gameOfLife.get_world()[3][1]).toEqual(false);
    });

    it("should bring to life the dead peripheral cells", function() {
      expect(gameOfLife.get_world()[2][0]).toEqual(true);
      expect(gameOfLife.get_world()[2][2]).toEqual(true);
    });

    it("should not revive any other cells", function() {
      expect(gameOfLife.get_world()[0][0]).toBeFalsy();
      expect(gameOfLife.get_world()[1][0]).toBeFalsy();
      expect(gameOfLife.get_world()[3][0]).toBeFalsy();

      expect(gameOfLife.get_world()[0][3]).toBeFalsy();
      expect(gameOfLife.get_world()[1][3]).toBeFalsy();
      expect(gameOfLife.get_world()[2][3]).toBeFalsy();
      expect(gameOfLife.get_world()[3][3]).toBeFalsy();
    });
  });

  describe("a world where all live cells have three living neighbours each", function() {
    beforeEach(function() {
      gameOfLife.populateCell(1, 1);
      gameOfLife.populateCell(2, 1);
      gameOfLife.populateCell(2, 2);
      gameOfLife.populateCell(1, 2);
      gameOfLife.step();
    });

    it("all the original cells should be alive, and no others", function() {
      expect(gameOfLife.get_world()[0][0]).toBeFalsy();
      expect(gameOfLife.get_world()[1][0]).toBeFalsy();
      expect(gameOfLife.get_world()[2][0]).toBeFalsy();
      expect(gameOfLife.get_world()[3][0]).toBeFalsy();

      expect(gameOfLife.get_world()[0][1]).toBeFalsy();
      expect(gameOfLife.get_world()[1][1]).toEqual(true);
      expect(gameOfLife.get_world()[2][1]).toEqual(true);
      expect(gameOfLife.get_world()[3][1]).toBeFalsy();

      expect(gameOfLife.get_world()[0][2]).toBeFalsy();
      expect(gameOfLife.get_world()[1][2]).toEqual(true);
      expect(gameOfLife.get_world()[2][2]).toEqual(true);
      expect(gameOfLife.get_world()[3][2]).toBeFalsy();

      expect(gameOfLife.get_world()[0][3]).toBeFalsy();
      expect(gameOfLife.get_world()[1][3]).toBeFalsy();
      expect(gameOfLife.get_world()[2][3]).toBeFalsy();
      expect(gameOfLife.get_world()[3][3]).toBeFalsy();
    });
  });

  describe("a world where a live cell has more than three living neighbours", function() {
    beforeEach(function() {
      gameOfLife.populateCell(1, 1);
      gameOfLife.populateCell(2, 0);
      gameOfLife.populateCell(2, 1);
      gameOfLife.populateCell(2, 2);
      gameOfLife.populateCell(3, 1);
      gameOfLife.step();
    });

    it("should kill the cell with three living neighbours", function() {
      expect(gameOfLife.get_world()[2][1]).toEqual(false);
    });

    it("should re-populate the dead cells with exactly three living neighbours", function() {
      expect(gameOfLife.get_world()[1][2]).toEqual(true);
      expect(gameOfLife.get_world()[3][2]).toEqual(true);
      expect(gameOfLife.get_world()[1][0]).toEqual(true);
      expect(gameOfLife.get_world()[3][0]).toEqual(true);
    });
  });

  describe("a game which executes a step", function() {
    var itHappened = false;

    beforeEach(function() {
      gameOfLife.onStep(function() {
        itHappened = true;
      });

      gameOfLife.step();
    });

    it("should execute the callback on a step", function() {
      expect(itHappened).toEqual(true);
    });

    it("should increment the generation number", function() {
      expect(gameOfLife.get_generation()).toEqual(1);
    });
  });

  describe("a game which is started with two iterations", function() {
    var timesExecutedStepCallback = 0;

    beforeEach(function() {
      gameOfLife.onStep(function() {
        timesExecutedStepCallback++;
      });

      gameOfLife.start(0, 2);
    });

    it("should execute the callback on each step", function() {
      expect(timesExecutedStepCallback).toEqual(2);
    });

    it("should increment the generation twice", function() {
      expect(gameOfLife.get_generation()).toEqual(2);
    });
  });

  describe("a game which is started with three iterations and a single blinker population", function() {
    beforeEach(function() {
      gameOfLife.populateCell(1, 1);
      gameOfLife.populateCell(2, 1);
      gameOfLife.populateCell(3, 1);

      gameOfLife.start(0, 3);
    });

    it("should kill the living peripheral cells", function() {
      expect(gameOfLife.get_world()[1][1]).toEqual(false);
      expect(gameOfLife.get_world()[2][1]).toEqual(true);
      expect(gameOfLife.get_world()[3][1]).toEqual(false);
      expect(gameOfLife.get_world()[2][0]).toEqual(true);
      expect(gameOfLife.get_world()[2][2]).toEqual(true);
    });
  });
});