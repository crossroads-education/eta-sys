import * as eta from "eta-lib";
import * as oracledb from "oracledb";

/**
Helpers to make Oracle DB connections conform to MySQL convention to some extent.
*/
export class HelperOracle {
    /**
    Connects to an oracle database (specified in eta.config) based on the current time.
    */
    public static getConnection(callback: (err: Error, conn: oracledb.IConnection) => void): void {
        let dbConfig: any = eta.config.oracle.db.day;
        let now: Date = new Date();
        if (eta.config.oracle.db.useNight && (now.getHours() >= 22 || now.getHours() <= 5)) {
            dbConfig = eta.config.oracle.db.night;
        }
        oracledb.getConnection(dbConfig, callback);
    }

    /**
    Collects all rows from a query into one array without absurd memory allocation.
    Borrowed and modified from https://gist.github.com/bjouhier/f4f991895fbe62ab1972.
    */
    public static queryAll(conn: oracledb.IConnection, sql: string, params: string[], callback: (err: Error, rows?: any[], metadata?: any) => void): void {
        let allRows: any[][] = [];
        conn.execute(sql, params, {
            "outFormat": oracledb.OBJECT,
            "resultSet": true
        }, (err: Error, result: oracledb.IExecuteReturn) => {
            if (err) {
                return callback(err);
            }
            function fetch() {
                let max: number = 50;
                result.resultSet.getRows(max, (err: Error, rows: any[][]) => {
                    if (err) {
                        return callback(err);
                    }
                    allRows = allRows.concat(rows);
                    if (rows.length === max) {
                        fetch();
                    } else {
                        result.resultSet.close((err: Error) => {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, allRows, result.metaData);
                        });
                    }
                });
            }
            fetch.apply(this);
        });
    }
}
