const cp = require("child_process");
const path = require("path");

class Database {
  constructor(file) {
    this.file = path.resolve(file);
  }

  call(op, sql, args) {
    const input = JSON.stringify(args || []);
    const out = cp.execFileSync(
      "C:\\Python27\\python.exe",
      [path.join(__dirname, "sqlite_bridge.py"), this.file, op, sql || "", input],
      { encoding: "utf8" }
    );

    const result = JSON.parse(out);
    if (result.error) throw new Error(result.error);
    return result;
  }

  pragma(sql) {
    return this.call("pragma", sql, []);
  }

  exec(sql) {
    return this.call("exec", sql, []);
  }

  prepare(sql) {
    const self = this;

    return {
      run: function() {
        const args = Array.prototype.slice.call(arguments);
        return self.call("run", sql, args);
      },

      get: function() {
        const args = Array.prototype.slice.call(arguments);
        return self.call("get", sql, args).row;
      },

      all: function() {
        const args = Array.prototype.slice.call(arguments);
        return self.call("all", sql, args).rows;
      }
    };
  }
}

module.exports = Database;