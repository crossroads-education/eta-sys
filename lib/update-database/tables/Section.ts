import * as eta from "eta-lib";

import * as oracledb from "oracledb";

import { EtaTable } from "../EtaTable";
import { HelperOracle } from "../../helpers/HelperOracle";

export default class Section extends EtaTable {

    public getDuplicateUpdateSql(): string {
        return `
            active = VALUES(active),
            room = VALUES(room),
            meetingType = VALUES(meetingType),
            maximumEnrolled = VALUES(maximumEnrolled),
            totalEnrolled = VALUES(totalEnrolled),
            creditHours = VALUES(creditHours),
            days = VALUES(days),
            start = VALUES(start),
            \`end\` = VALUES(\`end\`),
            professor = VALUES(professor)
        `;
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
                TO_NUMBER(CONCAT(ACAD_TERM_CD, CLS_NBR)) AS "id",
                (CASE WHEN
                    CLS_STAT_CD = 'A'
                    THEN 1
                    ELSE 0
                END) AS "active",
                FACIL_ID AS "room",
                NVL(TO_CHAR(CRS_CMPNT_CD), 'N/A') AS "meetingType",
                CLS_ENRL_CPCTY_NBR AS "maximumEnrolled",
                CLS_TOT_ENRL_NBR AS "totalEnrolled",
                CLS_ASSCT_MIN_UNT_NBR AS "creditHours",
                CLS_NBR AS "number",
                TO_NUMBER(CRS_ID) AS "course",
                CONCAT(ACAD_TERM_CD, CONCAT('_', (CASE WHEN
                    (NOT (CLS_SESN_CD LIKE 'SS%')) AND (NOT (CLS_SESN_CD = '1'))
                    THEN '1'
                    ELSE CLS_SESN_CD
                END))) AS "term",
                NVL(TO_CHAR(CLS_DRVD_MTG_PTRN_CD), 'WEB') AS "days",
                TO_CHAR(CLS_MTG_STRT_TM, 'HH24:MI:SS') AS "start",
                TO_CHAR(CLS_MTG_END_TM, 'HH24:MI:SS') AS "end",
                NVL(TO_CHAR(PRSN_UNIV_ID), '') AS "professor"
            FROM
                dss_rds.SR_CMB_CLS_INSTR_INST_GT
            WHERE
                ACAD_TERM_CD = :term AND
                INST_CD = 'IUINA'`;
        HelperOracle.queryAll(this.oracleConn, sql, [term], (err: Error, iuSections: any[]) => {
            if (err) {
                callback(err);
            } else {
                // key: term_session
                let terms: { [key: string]: number } = {};
                for (let i: number = 0; i < eta.term.terms.length; i++) {
                    let term: eta.Term = eta.term.terms[i];
                    terms[term.term + "_" + term.session] = term.id;
                }
                for (let i: number = 0; i < iuSections.length; i++) {
                    iuSections[i].term = terms[iuSections[i].term.toString()];
                }
                callback(null, iuSections);
            }
        });
    }
}
