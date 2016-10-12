import * as eta from "eta-lib";

import * as oracledb from "oracledb";

import { EtaTable } from "../EtaTable";

export default class Person extends EtaTable {

    public shouldIgnoreDuplicates(): boolean {
        return true;
    }

    public requiresTerm(): boolean {
        return true;
    }

    public fetch(term: string, callback: (err: Error, rows?: any[]) => void): void {
        let sql: string = `
            SELECT DISTINCT
                "PRSN_UNIV_ID" AS "id",
                "PRSN_NTWRK_ID" AS "username",
                COALESCE(
                    "PRSN_CMP_EMAIL_ID",
                    "PRSN_OTHR_EMAIL_ID",
                    "PRSN_PREF_EMAIL_ADDR"
                ) AS "email",
                "PRSN_PRM_1ST_NM" AS "firstName",
                "PRSN_PRM_LAST_NM" AS "lastName"
            FROM
                dss_rds.SR_CLS_ENRL_MGMT_GT
            WHERE
                INST_CD = 'IUINA' AND
                ACAD_TERM_CD = :term AND
                PRSN_UNIV_ID IS NOT NULL AND
                PRSN_PRM_LAST_NM IS NOT NULL AND
                PRSN_PRM_1ST_NM IS NOT NULL AND
                PRSN_NTWRK_ID IS NOT NULL`;
        eta.oracle.queryAll(this.oracleConn, sql, [term], (err: Error, iuPersons: eta.Person[]) => {
            if (err) {
                callback(err);
                return;
            }
            sql = `
                SELECT DISTINCT
                    PRSN_UNIV_ID AS "id",
                    CLS_INSTR_NTWRK_ID AS "username",
                    NVL(TO_CHAR(CLS_INSTR_GDS_CMP_EMAIL_ADDR), 'N/A') AS "email",
                    REGEXP_SUBSTR(CLS_INSTR_NM, '[^, ]+', 1, 2) AS "firstName",
                    REGEXP_SUBSTR(CLS_INSTR_NM, '[^, ]+', 1) AS "lastName"
                FROM
                    dss_rds.SR_CMB_CLS_INSTR_INST_GT
                WHERE
                    INST_CD = 'IUINA' AND
                    ACAD_TERM_CD = :term AND
                    PRSN_UNIV_ID IS NOT NULL AND
                    CLS_INSTR_NM IS NOT NULL AND
                    CLS_INSTR_NTWRK_ID IS NOT NULL`;
            eta.oracle.queryAll(this.oracleConn, sql, [term], (err: Error, iuProfPersons: eta.Person[]) => {
                if (err) {
                    callback(err);
                    return;
                }
                iuPersons = iuPersons.concat(iuProfPersons);
                callback(null, iuPersons);
            });
        });
    }
}
