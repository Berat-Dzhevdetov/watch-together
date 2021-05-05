// -- Sammy.js -- /plugins/sammy.handlebars.js
// http://sammyjs.org
// Version: 0.7.6
// Built: 2014-08-26 10:45:31 +0300
(function(factory) { if (typeof define === "function" && define.amd) { define(["jquery", "sammy", "handlebars"], factory) } else {
        (window.Sammy = window.Sammy || {}).Handlebars = factory(window.jQuery, window.Sammy) } })(function($, Sammy, Handlebars) { Handlebars = Handlebars || window.Handlebars;
    Sammy.Handlebars = function(app, method_alias) { var handlebars_cache = {}; var handlebars = function(template, data, partials, name) { if (typeof name == "undefined") { name = template } var fn = handlebars_cache[name]; if (!fn) { fn = handlebars_cache[name] = Handlebars.compile(template) }
            data = $.extend({}, this, data);
            partials = $.extend({}, data.partials, partials); return fn(data, { partials: partials }) }; if (!method_alias) { method_alias = "handlebars" }
        app.helper(method_alias, handlebars) }; return Sammy.Handlebars });