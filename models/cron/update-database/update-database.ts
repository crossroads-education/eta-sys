import * as eta from "eta-lib";

import * as express from "express";
import * as fs from "fs";
import * as oracledb from "oracledb";
import * as schedule from "node-schedule";

import { EtaTable } from "../../../lib/update-database/EtaTable";
import { HelperOracle } from "../../../lib/helpers/HelperOracle";

export class Model implements eta.Model {

    private processTable(db: oracledb.IConnection, file: string, useTerm?: string): void {
        let tableHandler: EtaTable, tableName: string;
        try {
            let handlerModule: any = require(file);
            tableName = handlerModule.default.name;
            tableHandler = new handlerModule.default(db);
        } catch (ex) {
            eta.logger.warn("Could not include Oracle table handler: " + ex.toString());
            return;
        }
        let term: string = eta.term.getCurrent().term;
        if (useTerm) {
            term = useTerm;
        }
        eta.logger.trace("Fetching " + tableName + "...");
        tableHandler.fetch(term, (err: Error, rows: any[]) => {
            if (err) {
                eta.logger.warn("Couldn't process table " + tableName + ": " + err.message);
                return;
            }
            let sql = "INSERT ";
            if (tableHandler.shouldIgnoreDuplicates()) {
                sql += "IGNORE ";
            }
            let result: eta.SqlValueResult = eta.sql.getInsertMany(rows, true);
            sql += "INTO `" + tableName + "` " + result.columns + " VALUES " + result.sql;
            let duplicateUpdateSql: string = tableHandler.getDuplicateUpdateSql();
            if (duplicateUpdateSql != "") {
                sql += " ON DUPLICATE KEY UPDATE " + duplicateUpdateSql;
            }
            eta.db.query(sql, result.params, (err: eta.DBError, rows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    return;
                }
                eta.logger.trace("Successfully updated table " + tableName);
            });
        });
    }

    private updateDatabase(callback: () => void, term?: string): void {
        HelperOracle.getConnection((err: Error, db: oracledb.IConnection) => {
            if (err) {
                eta.logger.error("Could not connect to Oracle DB: " + err.message);
                callback();
                return;
            }
            let tableDir: string = eta.server.modules["sys"].baseDir + "lib/update-database/tables/";
            fs.readdir(tableDir, (err: Error, files: string[]) => {
                if (err) {
                    eta.logger.error("Could not list " + tableDir + ": " + err.message);
                    callback();
                    return;
                }
                for (let i: number = 0; i < files.length; i++) {
                    if (!files[i].endsWith(".js")) {
                        continue;
                    }
                    try {
                        this.processTable(db, tableDir + files[i], term);
                    } catch (ex) {
                        eta.logger.warn("Couldn't process: " + files[i] + ": " + ex.toString());
                    }
                }
                callback();
            });
        });
    }

    public onScheduleInit(): void {
        schedule.scheduleJob("0 1 2 * * *", () => {
            this.updateDatabase(() => { });
        });
    }

    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        this.updateDatabase(() => {
            callback({ "raw": "Success." });
        }, req.query.term);
    }
}
