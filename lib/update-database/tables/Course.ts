import * as eta from "eta-lib";

import * as oracledb from "oracledb";

import { EtaTable } from "../EtaTable";

export default class Course extends EtaTable {

    public getDuplicateUpdateSql(): string {
        return "";
    }

    public shouldIgnoreDuplicates(): boolean {
        return true;
    }

    public requiresTerm(): boolean {
        return true;
    }

    public fetch(term: string, callback: (err: Error, rows?: any[]) => void): void {
        let sql: string = `
            SELECT DISTINCT
                TO_NUMBER("CRS_ID") AS "id",
                TRIM("CRS_SUBJ_CD") AS "subject",
                TRIM("CRS_CATLG_NBR") AS "number",
                0 AS "supported",
                0 AS "center",
                NULL AS "tutor",
                NULL AS "room",
                0 AS "fee"
            FROM
                dss_rds.SR_CMB_CLS_INSTR_INST_GT
            WHERE
                ACAD_TERM_CD = :term
            ORDER BY "subject" ASC, "number" ASC`;
        eta.oracle.queryAll(this.oracleConn, sql, [term], (err: Error, iuCourses: eta.Course[]) => {
            if (err) {
                callback(err);
            } else {
                callback(null, iuCourses);
            }
        });
    }
}
