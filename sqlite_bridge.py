import sys
import sqlite3
import json

dbfile = sys.argv[1]
op = sys.argv[2]
sql = sys.argv[3]
args = json.loads(sys.argv[4])

try:
    conn = sqlite3.connect(dbfile)
    conn.text_factory = str
    cur = conn.cursor()

    if op == "pragma":
        cur.execute("PRAGMA " + sql)
        conn.commit()
        result = {}

    elif op == "exec":
        cur.executescript(sql)
        conn.commit()
        result = {}

    elif op == "run":
        cur.execute(sql, args)
        conn.commit()
        result = {
            "lastInsertRowid": cur.lastrowid,
            "changes": cur.rowcount
        }

    elif op == "get":
        cur.execute(sql, args)
        row = cur.fetchone()

        if row is None:
            result = {"row": None}
        else:
            names = [d[0] for d in cur.description]
            result = {"row": dict(zip(names, row))}

    elif op == "all":
        cur.execute(sql, args)
        rows = cur.fetchall()
        names = [d[0] for d in cur.description]

        result = {
            "rows": [dict(zip(names, row)) for row in rows]
        }

    else:
        raise Exception("Unknown operation")

    conn.close()
    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)