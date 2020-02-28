﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Olive;
using System;

namespace Controllers
{
    public class BaseController : Olive.Mvc.Controller
    {
        public BaseController()
        {
            ApiClient.FallBack.Handle(arg => Notify(arg.FriendlyMessage, false));
        }

        [NonAction]
        public new ActionResult Unauthorized() => Redirect("/login");

        protected override string GetDefaultBrowserTitle(ActionExecutingContext context)
            => Microservice.Me.Name + " > " + base.GetDefaultBrowserTitle(context);



        public override void OnActionExecuting(ActionExecutingContext context)
        {
            ViewData["ExecutionStart"] = LocalTime.Now;
            base.OnActionExecuting(context);
        }

        public override void OnActionExecuted(ActionExecutedContext context)
        {
            base.OnActionExecuted(context);
            var start = (DateTime)ViewData["ExecutionStart"];
            Log.Info("Finished executing " + context.ActionDescriptor.DisplayName + " in " + LocalTime.Now.Subtract(start).ToNaturalTime());
        }
    }

}

namespace ViewComponents
{
    public abstract class ViewComponent : Olive.Mvc.ViewComponent { }
}