/// <reference path="../autoload.ts"/>

/// <amd-dependency path="jquery-ui"/>

export module settings {

    // used and modified from http://stackoverflow.com/a/5158301
    function getParameterByName(name : string) : string {
        var match = RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    }

    function getInputSubmitHandler(callback : () => void) : (evt : JQueryEventObject) => void {
        return function(evt : JQueryEventObject) {
            if (evt.which == 13) { // pressed enter
                callback.call(this);
            }
        };
    }

    function onAddSetting() {
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
        console.log(params);
        $.post("/post/settings", params, function(data) {
            // location.reload();
        });
    }

    function onNewPage() {
        let pageName : string = $("#new-page-name").val();
        if (pageName == "") {
            return;
        }
        if (!pageName.startsWith("/")) {
            pageName = "/" + pageName;
        }
        let div : JQuery = $($("div.page-section")[0]).clone();
        div.find("h3.page-title").html(pageName);
        div.find("tbody").attr("data-page", pageName);
        div.find("tbody").html(""); // clearing any rows
        div.find("button[data-action='add-setting']").on("click", onAddSetting);
        div.find("input[data-action='add-setting'][data-param='name']").on("keydown", getInputSubmitHandler(onAddSetting));
        div.find(".new-setting-form").children().each(function(index : number, element : HTMLElement) {
            console.log(element);
            element.setAttribute("data-page", pageName);
        });
        $("#pages").append(div);
    }

    $(document).ready(function() {
        $("#new-page-name").on("keydown", getInputSubmitHandler(onNewPage));
        $("#new-page-submit").on("click", onNewPage);

        $("input[data-action='add-setting'][data-param='name']").on("keydown", getInputSubmitHandler(onAddSetting));
        $("button[data-action='add-setting']").on("click", onAddSetting);

        let active : boolean | number = false;
        let lastPage : string = getParameterByName("lastPage");
        if (lastPage) {
            $("div.page-section").each(function(index : number, element : HTMLElement) {
                if (element.children[0].innerHTML == lastPage) {
                    active = index;
                    return;
                }
            });
        }

        $("#pages").accordion({
            "active": active,
            "header": "> div.page-section > h3.page-title",
            "collapsible": true,
            "heightStyle": "content"
        });
    });
}
