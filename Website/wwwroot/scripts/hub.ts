﻿/// <amd-dependency path='olive/olivePage' />

import Url from "olive/components/url";
import { FeaturesMenuFactory } from "app/featuresMenu/featuresMenu";
import AjaxRedirect from "olive/mvc/ajaxRedirect";
import CrossDomainEvent from "olive/components/crossDomainEvent";
import Service from "app/model/service";
import BreadcrumbMenu from "app/featuresMenu/breadcrumbMenu";
import { ModalHelper } from "../lib/olive.mvc/typings/components/modal";

export default class Hub implements IService {

    constructor(
        private url: Url,
        private ajaxRedirect: AjaxRedirect,
        private featuresMenuFactory: FeaturesMenuFactory,
        private breadcrumbMenu: BreadcrumbMenu
    ) { }

    public initialize() {

        Service.registerServices();
        this.featuresMenuFactory.enableFeaturesTreeView();
        this.breadcrumbMenu.enableBreadcrumb();
        window["resolveServiceUrl"] = this.url.effectiveUrlProvider;

        CrossDomainEvent.handle("setViewFrameHeight", h => this.setViewFrameHeight(h));
        CrossDomainEvent.handle("setServiceUrl", u => Service.onNavigated(u.url, u.title));
        CrossDomainEvent.handle("openModal", u => {
            if (u.url) {
                window.page.modal.close();
                window.page.modal.open(null, u.url);
            }
        });

        //initial right task menu after 3 sec delay.
        setTimeout(() => {
            var iframe = $("#taskiFram");
            if (iframe.is(":visible") && iframe.attr("data-src"))
                iframe.attr("src", iframe.attr("data-src")).removeAttr("data-src");
        }, 2000);

        //this function deal with touch events for task system.
        this.initServiceWorker();

        this.loadServiceHealthChecks();

    }

    loadServiceHealthChecks(): void {

        $(".service-tiles .tile").each((inx, item) => {
            var _this = $(item);
            _this.css("background", "yellow");
            $.get(_this.attr('url'), () => {
                _this.css("background", "green");
            }).fail(() => {
                _this.css("background", "red");
            });

        });
    }

    setViewFrameHeight(height) {

        if (height <= 0) return;

        height = Math.max($(".side-bar").height() - 400, height);

        var currentFrameHeight = $("iframe.view-frame").height();

        if (currentFrameHeight < height) this.setiFrameHeight(height);
        else {
            // Frame is larger. But is it too large?
            if (currentFrameHeight > height + 150) this.setiFrameHeight(height);
        }
    }

    setiFrameHeight(height: number) {
        let iFrame = $("iframe.view-frame");
        if (iFrame.attr("src") !== "")
            iFrame.css("cssText", "height: " + (height + 80) + "px !important;");
        else
            iFrame.hide();
    }

    public go(url: string, iframe: boolean) {
        if (iframe) {
            url = this.url.effectiveUrlProvider(url, null);
            $("iframe.view-frame").attr("src", url);
            $(".feature-frame-view").show();
            $("main").hide();
        }
        else this.ajaxRedirect.go(url);
    }


    initServiceWorker(): any {
        if ("serviceWorker" in navigator) {
            try {
                navigator.serviceWorker
                    .register("/service-worker.js")
                    .then(() => {
                        console.log("Service worker registered");
                    })
                    .catch(error => { console.log(error); });
            }
            catch (err) {
                console.log(err);
            }
        }
    }


}

