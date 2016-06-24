import * as eta from "eta-lib";
import * as express from "express";
import * as querystring from "querystring";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if ((!eta.params.test(req.body, ["page", "name", "type"])) || ((!req.body.value && req.body.value !== "") && req.body.type != "boolean")) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        if (req.body.type == "boolean") {
            req.body.value = !!req.body.value;
        }
        eta.logger.json(req.body);
        eta.setting.set(req.body.page, req.body.name, req.body.value, req.body.type, (success : boolean) => {
            eta.logger.trace("Setting set: " + success);
            eta.setting.init();
            if (req.body.shouldRedirect) {
                res.redirect("../edit/settings?lastPage=" + querystring.escape(req.body.page));
            } else {
                res.send(success.toString());
            }
        });
    }
}
