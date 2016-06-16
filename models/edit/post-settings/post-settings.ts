import * as eta from "eta-lib";
import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["page", "name", "value", "type"])) {
            callback({errcode: eta.http.InvalidParameters});
            eta.logger.trace("Invalid parameters");
            eta.logger.json(req.body);
            return;
        }
        eta.setting.set(req.body.page, req.body.name, req.body.value, req.body.type, (success : boolean) => {
            eta.setting.init();
            eta.redirect.back(req, res);
        });
    }
}
