﻿import Url from 'olive/components/url';
import Service from 'app/model/service';
import Waiting from 'olive/components/waiting'
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
declare var requirejs: any;

export class FeaturesMenuFactory implements IService {
    constructor(private url: Url, private waiting: Waiting, private ajaxRedirect: AjaxRedirect) { }

    public enableFeaturesTreeView() {
        var menu = new FeaturesMenu(this.url, this.waiting, this.ajaxRedirect);
        menu.bindExpandIcons();
        menu.bindFeatureMenuItemsClicks($(".feature-menu-item > a:not([href=''])"));
        menu.showSubMenu();
        menu.enableIFrameClientSideRedirection($(".feature-menu-item a:not([data-redirect])"));
    }

    public bindItemListClick() {
        var menu = new FeaturesMenu(this.url, this.waiting, this.ajaxRedirect);
        menu.bindMidMenuItemsClicks($("div.item > a:not([href=''])"));
        menu.enableIFrameClientSideRedirection($("div.item a:not([data-redirect])"));
    }

    public show(featureId: string) {
        let featureLink = $("#" + featureId + " > a");

        if (!featureLink) {
            console.log("Could not find menu item for " + featureLink);
            return;
        }

        featureLink.click();
    }
}

export default class FeaturesMenu {
    constructor(private url: Url, private waiting: Waiting, private ajaxRedirect: AjaxRedirect) { }

    enableIFrameClientSideRedirection(selector: JQuery) {
        selector.each((ind, el) => {
            $(el).click(e => {
                $("main").show();

                let iFrameHolder = $("#iFrameHolder");
                iFrameHolder.hide().attr("style", "height: 0;");

                let targetIframe = $("iframe.view-frame");
                targetIframe.attr("src", "").attr("style", "");
                let link = $(e.currentTarget);

                let url = link.attr("href");

                if (url.startsWith("/under/")) // Go to the children page
                {
                    url = Service.fromName("hub").BaseUrl + url; // We should make URL absolute to fix cross module navigation ambiguous 
                    this.ajaxRedirect.go(url)
                    return false;
                }

                if (!url.startsWith("/[") || !url.contains("]")) {
                    throw new Error("The url does not contain the service info part. Urls should start with [ServiceName]/.");
                }

                let serviceName = url.substring(2, url.indexOf("]"));

                var baseUrl = Service.fromName(serviceName).BaseUrl;
                if (!baseUrl.startsWith("http"))
                    baseUrl = baseUrl.withPrefix(window.location.protocol + "//");

                url = url.substring(serviceName.length + 3)
                url = this.url.makeAbsolute(baseUrl, url);

                targetIframe.attr("src", url);
                $("main").hide();

                this.waiting.show();

                targetIframe.on("load", null, null, e => {
                    this.waiting.hide();
                    if (targetIframe.attr("src") !== "")
                        iFrameHolder.attr("style", "").show();
                    else
                        iFrameHolder.hide().attr("style", "height: 0;");
                });

                return false;
            });
        });
    }

    showSubMenu() {
        let sideExpandedChildItems = $(".feature-menu-item[expand='true'][is-side-menu-child='true']");
        let hasExpandedItemInSubmenuVisible = sideExpandedChildItems.length > 0;

        if (!hasExpandedItemInSubmenuVisible) return;

        this.showSubMenuOf(sideExpandedChildItems);
    }

    showSubMenuOf(parent: any) {
        requirejs(["handlebars"], (x) => { this.generateTopMenu(x, parent); });
    }

    bindExpandIcons(): void {
        $(".side-bar > .features-side-menu > ul > .feature-menu-item").each((ind, el) => {
            let $el = $(el);
            let hasChildMenuItems = $("ul", $el).length > 0;
            let expandIcon = $("<span class='arrow-right'></span>");

            if (hasChildMenuItems) {
                // Add the expand button;
                expandIcon.click((e) => {
                    let expanded = $el.attr("expand") === "true";
                    let $this = $(e.target);

                    if (expanded) {
                        $this.removeClass().addClass("arrow-right");
                        $el.attr("expand", "false");
                    }
                    else {
                        $this.removeClass().addClass("arrow-down");
                        $el.attr("expand", "true");
                    }
                });
            }
            else {
                expandIcon.prop('disabled', true);
                expandIcon.html("&nbsp;");
            }

            if ($el.attr("expand") === "true")
                expandIcon.removeClass().addClass("arrow-down");

            let emptyLink = $("> a[href='']", $el);
            if (emptyLink.length > 0)
                emptyLink.click(e => {
                    expandIcon.click();
                    e.stopPropagation();
                    return false;
                });

            if (hasChildMenuItems) {
                $el.prepend(expandIcon);
            }
        });
    }

    bindFeatureMenuItemsClicks(selector: JQuery) {
        selector.each((ind, el) => {
            let link = $(el);
            link.click(e => this.onLinkClicked(link));
        });
    }

    bindMidMenuItemsClicks(selector: JQuery) {
        selector.each((ind, el) => {
            let link = $(el);
            link.click(e => this.onMidMenuClicked(link));
        });
    }

    onMidMenuClicked(link: JQuery) {
        $(`li[data-nodeid='${link.attr("id")}']`).addClass("active");

        let wrapper = $(`#${link.attr("id")}`);
        wrapper.addClass("active");
        this.showSubMenuOf(wrapper);
    }

    bindSubMenuClicks(selector: JQuery) {
        selector.each((ind, el) => {
            let link = $(el);
            link.click(e => this.onSubMenuClicked(link));
        });
    }

    onSubMenuClicked(link: JQuery) {
        var wrapper = link.closest(".feature-menu-item");
        $(".feature-top-menu .active").removeClass("active");
        $.each(wrapper.parents("li"), (i: number, p: any) => {
            $(p).addClass("active");
        })
        wrapper.addClass("active");
        $("#" + wrapper.attr("id")).addClass("active");
    }

    onLinkClicked(link: JQuery) {

        //Hide iframe after each Ajax call.
        $("#iFrameHolder").hide().attr("style", "height: 0;");

        //check to see if click event is from mid-page or left page
        if (link.closest(".feature-menu-item").length === 0) {
            link = $(`#${link.attr("id")} > a`);
        }

        let wrapper = link.closest(".feature-menu-item");

        if (wrapper.attr("expand") === "true") {
            // Collapse the wrapper
            wrapper.attr("expand", "false");
        }
        else {
            // Expand the wrapper
            wrapper.attr("expand", "true");
        }

        // Update the exapnd icon.
        let expandIcon = $(".arrow-right", wrapper);

        if (expandIcon.length > 0) {
            expandIcon.removeClass().addClass("arrow-down")
        }
        else {
            expandIcon = $(".arrow-down", wrapper);
            expandIcon.removeClass().addClass("arrow-right")
        }

        $(".features-sub-menu").empty();
        // Set the active item
        $(".active").removeClass("active");
        $("#" + wrapper.attr("id")).addClass("active");
        $("." + wrapper.attr("id")).addClass("active");
        //top menu needs this
        wrapper.addClass("active");

        let isInSubmenu = wrapper.attr("side-menu-parent") !== undefined;

        if (isInSubmenu) {
            this.showSubMenuOf(wrapper);
            return true;
        }

        let opensTheSubmenu = wrapper.attr("is-side-menu-child") === "true";
        if (opensTheSubmenu) {
            this.showSubMenuOf(wrapper);
        }
        return true;
    }

    generateTopMenu(Handlebars: any, element) {

        //if the top menu has been already generated, so we ignore generating it again.
        if ($(".features-sub-menu ul").length > 0) {
            return;
        }

        let elementId = $(element).attr("id");

        if ($("body").data("currentMenu") === elementId && $(".features-sub-menu li").length > 0) {
            return;
        }
        else {
            $("body").data("currentMenu", elementId);
        }

        let topMenuData = $("#topMenu").attr("value");

        this.generateTopMenuHtml(topMenuData, element, Handlebars);

        let activeId = $(".feature-menu-item .active").attr("id");

        //make left and top menu active
        $(".feature-menu-item .active").parents("li.feature-menu-item").addClass("active");
        $(".feature-menu-item[data-nodeid=" + activeId + "]").addClass("active").parents("li.feature-menu-item").addClass("active");
    }

    generateTopMenuHtml(topMenuData, element, Handlebars) {

        let data = { menus: this.getObjects(JSON.parse(topMenuData), "ID", $(element).attr("id")) };

        let template = $("#sumMenu-template").html();

        var compiled = Handlebars.compile(template);

        var result = compiled(data);

        $(".features-sub-menu").append(result);

        this.bindSubMenuClicks($(".features-sub-menu .feature-menu-item > a:not([href=''])"));

        this.enableIFrameClientSideRedirection($(".features-sub-menu .feature-menu-item a:not([data-redirect])"));

        this.ajaxRedirect.enableRedirect($("a[data-redirect=ajax]"));

        $("." + $(".feature-menu-item[expand='true'][is-side-menu-child='true']").attr("id")).addClass("active");
    }

    getObjects(obj, key, val) {
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] === 'object') {
                objects = objects.concat(this.getObjects(obj[i], key, val));
            } else if (i === key && obj[key] === val) {
                objects.push(obj);
            }
        }
        return objects;
    }
}
