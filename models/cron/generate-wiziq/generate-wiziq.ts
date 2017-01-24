import * as eta from "eta-lib";

import * as express from "express";
import * as schedule from "node-schedule";

export class Model implements eta.Model {
    private generateWizIQRooms(callback: (err: Error) => void): void {
        let rooms: string[] = eta.config.wiziq.rooms;
        eta.center.getHours(eta.config.wiziq.onlineCenter, eta.term.getCurrent().id, (err: Error, hours?: { [key: string]: eta.HoursOfOperation }) => {
            if (err) {
                return callback(err);
            }
            let todayHours: eta.HoursOfOperation = hours[eta.time.getCurrentDayOfWeek()];
            let start: Date = eta.time.getDateFromTime(todayHours.open);
            if (start.getTime() < new Date().getTime()) {
                start = new Date();
            }
            let end: Date = eta.time.getDateFromTime(todayHours.close);
            let sql: string = `
                INSERT INTO OnlineRoom (letter, date, url)
                VALUES (?, CURDATE(), ?)
                ON DUPLICATE KEY UPDATE url = VALUES(url)`;
            for (let i: number = 0; i < rooms.length; i++) {
                eta.wiziq.schedule(start, end, rooms[i], (err: Error, result?: any) => {
                    if (err) {
                        return eta.logger.warn("Couldn't schedule room " + rooms[i] + ": " + err.message);
                    }
                    let url: string = result.CommonAttendeeUrl;
                    eta.db.query(sql, [rooms[i], url], (err: eta.DBError, rows: any[]) => {
                        if (err) {
                            return eta.logger.dbError(err);
                        }
                    });
                });
            }
            callback(null);
        });
    }

    public onScheduleInit(): void {
        schedule.scheduleJob("0 5 2 * * *", () => {
            this.generateWizIQRooms(() => {
                eta.logger.trace("Finished attempt to schedule WizIQ rooms.");
            });
        });
    }

    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        this.generateWizIQRooms((err: Error) => {
            if (err) {
                return callback({ status: err.message });
            }
            return callback({ status: "Check logs to ensure scheduling and DB insertion worked." });
        });
    }
}
