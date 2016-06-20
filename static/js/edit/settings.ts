/// <reference path="../autoload.ts"/>

export module settings {
    $(document).ready(function() {
        $("#new-page-submit").on("click", function() {
            let pageName : string = $("#new-page-name").val();
            if (pageName == "") {
                return;
            }
            if (!pageName.startsWith("/")) {
                pageName = "/" + pageName;
            }
            let div : JQuery = $($("div.page-section")[0]).clone();
            div.find("h3").html(pageName);
            div.find("tbody").attr("data-page", pageName);
            div.find("tbody").html(""); // clearing any rows
            $("#pages").append(div);
        });
        $("button[data-action='add-setting']").on("click", function() {
            let page : string = this.getAttribute("data-page");
            let params : {[key : string] : string} = {
                "value": "",
                "page": page
            };
            $("[data-action='add-setting'][data-page='" + page + "']").each(function() {
                if (this.tagName.toLowerCase() == "button") {
                    return;
                }
                params[this.getAttribute("data-param")] = this.value;
            });
            $.post("../post/settings", params, function(data) {
                location.reload();
            });
        });
    });
}
