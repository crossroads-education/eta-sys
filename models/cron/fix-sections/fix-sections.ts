import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {

    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = `
            UPDATE
                Visit
                    LEFT JOIN Section ON
                        Visit.section = Section.id
                    LEFT JOIN Term ON
                        Visit.term = Term.id
            SET
                Visit.section = IF(
                    Section.number IS NOT NULL AND Term.term IS NOT NULL,
                    CONCAT(Term.term, Section.number),
                    '0'
                )
            WHERE
                Visit.section != '' AND
                NOT Visit.section LIKE '%,%'`;
        eta.db.query(sql, [], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            eta.logger.trace("Fixed Visit (single section).");
            sql = eta.visit.getMultipleSql() + `
                WHERE
                    Visit.section LIKE '%,%'`;
            eta.db.query(sql, [], (err: eta.DBError, rows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                let oldVisits: any[] = eta.visit.parseMultiples(rows);
                let newVisits: eta.Visit[] = [];
                for (let i: number = 0; i < oldVisits.length; i++) {
                    let sectionIDs: string[] = [];
                    for (let k: number = 0; k < oldVisits[i].sections.length; k++) {
                        let section: any = oldVisits[i].sections[k];
                        sectionIDs.push(section.term.toString() + section.number);
                    }
                    newVisits.push({
                        "student": oldVisits[i].student,
                        "center": null,
                        "timeIn": oldVisits[i].timeIn.toISOString(),
                        "timeOut": null,
                        "section": sectionIDs.join(","),
                        "term": null
                    });
                }
                let result: eta.SqlValueResult = eta.sql.getInsertMany(newVisits, true);
                sql = "INSERT IGNORE INTO Visit " + result.columns + " VALUES " + result.sql
                    + " ON DUPLICATE KEY UPDATE section = VALUES(section)";
                eta.db.query(sql, result.params, (err: eta.DBError, rows: any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({ errcode: eta.http.InternalError });
                        return;
                    }
                    eta.logger.trace("Fixed Visit (multiple sections).");
                    sql = `
                        UPDATE
                            StudentSection
                                LEFT JOIN Section ON
                                    StudentSection.section = Section.id
                                LEFT JOIN Term ON
                                    Section.term = Term.id
                        SET
                            StudentSection.section = CONCAT(Term.term, Section.number)`;
                    eta.db.query(sql, [], (err: eta.DBError, rows: any[]) => {
                        if (err) {
                            eta.logger.dbError(err);
                            callback({ errcode: eta.http.InternalError });
                            return;
                        }
                        eta.logger.trace("Fixed StudentSection.");
                        sql = `
                            UPDATE
                                Section
                                    LEFT JOIN Term ON
                                        Section.term = Term.id
                            SET
                                Section.id = CONCAT(Term.term, Section.number)`;
                        eta.db.query(sql, [], (err: eta.DBError, rows: any[]) => {
                            if (err) {
                                eta.logger.dbError(err);
                                callback({ errcode: eta.http.InternalError });
                                return;
                            }
                            eta.logger.trace("Fixed Section.");
                            callback({ "status": "Success" });
                        });
                    });
                });
            });
        });
    }
}
