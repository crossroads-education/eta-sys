import * as eta from "eta-lib";

import * as oracledb from "oracledb";

import { EtaTable } from "../EtaTable";

export default class StudentSection extends EtaTable {

    public getDuplicateUpdateSql(): string {
        return "status = VALUES(status)";
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
                PRSN_UNIV_ID AS "student",
                TO_NUMBER(CONCAT(ACAD_TERM_CD, CLS_NBR)) AS "section",
                (CASE WHEN
                    (STU_ENRL_STAT_CD IN ('D', 'W')) OR
                    (STU_ENRL_STAT_CD = 'E' AND STU_GRD_BASIS_CD = 'WDR')
                    THEN 'D'
                    ELSE 'E'
                    END
                ) AS "status"
            FROM
                dss_rds.SR_ENRL_RSTR_BY_PROXY_GT
            WHERE
                ACAD_TERM_CD = :term`;
        eta.oracle.queryAll(this.oracleConn, sql, [term], (err: Error, iuStudentSections: any[]) => {
            if (err) {
                callback(err);
            } else {
                callback(null, iuStudentSections);
            }
        });
    }
}
