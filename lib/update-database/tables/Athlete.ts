import * as eta from "eta-lib";

import * as oracledb from "oracledb";

import { EtaTable } from "../EtaTable";

export default class Athlete extends EtaTable {

    public getDuplicateUpdateSql(): string {
        return "";
    }

    public shouldIgnoreDuplicates(): boolean {
        return true;
    }

    public requiresTerm(): boolean {
        return false;
    }

    public fetch(term: string, callback: (err: Error, rows?: any[]) => void): void {
        let sql: string = `
            SELECT
                PRSN_UNIV_ID AS "id"
            FROM
                dss_rds.SR_STU_GRP_GT
            WHERE
                STU_GRP_CD LIKE 'RS%' AND
                INST_CD = 'IUINA'`;
        eta.oracle.queryAll(this.oracleConn, sql, [], (err: Error, iuAthletes: any[]) => {
            if (err) {
                callback(err);
            } else {
                callback(null, iuAthletes);
            }
        });
    }
}
