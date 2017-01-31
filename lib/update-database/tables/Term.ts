import * as eta from "eta-lib";

import * as oracledb from "oracledb";

import { EtaTable } from "../EtaTable";
import { HelperOracle } from "../../helpers/HelperOracle";

export default class Term extends EtaTable {

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
                "term", "name", "session",
                MIN("start") AS "start",
                MAX("end") AS "end"
            FROM
            (
                SELECT DISTINCT
                    ACAD_TERM_CD AS "term",
                    ACAD_TERM_DESC AS "name",
                    TO_CHAR(CLS_STRT_DT, 'YYYY-MM-DD') AS "start",
                    TO_CHAR(CLS_END_DT, 'YYYY-MM-DD') AS "end",
                    CLS_SESN_CD AS "session"
                FROM
                    dss_rds.SR_CMB_CLS_INSTR_INST_GT
                WHERE
                    INST_CD = 'IUINA' AND -- IUPUI per matching INST_DESC
                    ACAD_CAREER_CD = 'UGRD' AND -- Undergraduate per matching ACAD_CAREER_DESC
                    CLS_SESN_CD IN ('SS1', 'SS2', '1') AND
                    ACAD_TERM_BEG_DT > TO_DATE('2015-02-01', 'YYYY-MM-DD')
            ) "Term"
            GROUP BY "term", "name", "session"
            ORDER BY "term" ASC, "session" ASC`;
        HelperOracle.queryAll(this.oracleConn, sql, [], (err: Error, iuTerms: eta.Term[]) => {
            if (err) {
                callback(err);
            } else {
                callback(null, iuTerms);
            }
        });
    }
}
