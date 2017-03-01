import {Supertype, supertypeClass, property, remote} from 'amorphic';
import {AuthenticatingController} from "./tsmodel/AuthenticatingController";

@supertypeClass
export class BaseController extends AuthenticatingController {

	errorCount:     number = 0;
	value:			any;

	// Validators
	isName () {this.mustNotMatch("[^0-9A-Za-z \'\-]", "name")};
	isText () {this.mustNotMatch("[^\\-0-9A-Za-z !@#$%^&*()_+={}|\]\[\":;'<>?\',.]", "text")};
	isEmail () {
		this.mustMatch("^[^\@ ]+\@[^\@ \.]+\.[^\@ ]+", "email")
	};
	isNumeric () {
		this.mustNotMatch("[^0-9]", "numeric")
	};
	isPercent () {
		this.isNumeric();
		if(this.value && (this.value < 1 || this.value > 100))
			throw {message: "percent"}
	};
	isAlphaNumeric () {this.mustNotMatch("[^0-9A-Za-z]", "alphanumeric")};
	isPhone () {this.mustNotMatch("[^0-9 \(\)-]", "phone")};
	isSSN () {this.mustMatch("[0-9]{3}-[0-9]{2}-[0-9]{4}", "ssn")};
	isTaxID () {this.mustMatch("[0-9]{3}-[0-9]{2}-[0-9]{4}", "taxid") || this.mustMatch("[0-9]{2}-[0-9]{6}", "taxid")};
	isZip5 () {this.mustMatch("[0-9]{5}", "zip5")};
	notEmpty () {
		if (!this.value || this.value.length == 0) {
			throw {message: "required"};
		}
	};
	isWithin (min,max) {
		if (this.value < min)
			throw {message: "min", min: min}
		if (this.value > max)
			throw {message: "max", max: max}
	};
	isWithinCurrency (min,max) {
		if (this.value < min)
			throw {message: "min", min: this.formatCurrencyInternal(min)}
		if (this.value > max)
			throw {message: "max", max: this.formatCurrencyInternal(max)}
	};
	isWithinPercent (min,max) {
		if (this.value < min / 100)
			throw {message: "min", min: min + "%"}
		if (this.value > max / 100)
			throw {message: "max", max: max + "%"}
	};
	isMinLength (len) {
		if (this.isEmpty() || this.value.length < len) 
			throw {message: "minlength", minlength: len}
	};
	isMaxlength (len) {
		if (this.isEmpty || this.value.length > len) 
			throw {message: "maxlength", maxlength: len}
	};
	isEmpty (value?) {
		return this.value == null || this.value.length == 0
	};
	
	// Parsers
	parseCurrency () {
		if (!this.value) return 0;
		var n = this.value;
		n = n.replace(/k/i, '000');
		n = n.replace(/[^0-9\.\-]/g, "");
		var f = parseFloat(n);
		if (isNaN(f))
			throw {message: "currency"};
		var result = Math.floor(f * 100 + .5) / 100;
		return result;
	};
	parsePercent () {
		if (!this.value) return 0;
		var n = this.value;
		n = n.replace(/[^0-9\.\-]/g, "");
		var f = parseFloat(n);
		if (isNaN(f))
			throw {message: "number"};
		var result = f / 100;
		return result;
	};
	parseDate () {
		if (this.value == null || this.value.length == "") return null;
		var parsed = Date.parse(this.value);
		if (isNaN(parsed)) {
			throw {message: "date"}
		}
		return new Date(parsed);
	};
	parseDOB () {
		if (this.value == null || this.value.length == "") return null;
		var date = this.parseDate();
		var thisYear = (new Date()).getFullYear();
		var bornYear = date.getFullYear();
		if (bornYear > thisYear)
			date.setFullYear(bornYear - 100);
		if ((thisYear - bornYear    ) > 85)
			throw {message: "You must be age 85 or less"}
		return date;
	};
	parseNumber () {
		if (!this.value)
			return 0;
		var n = this.value;
		n = n.replace(/k/i, '000');
		n = n.replace(/[^0-9\.\-]/g, "");
		var f = parseFloat(n);
		if (isNaN(f))
			throw {message: "currency"};
		var result = f;
		return result;
	};
	
	// Formatters
	formatText () {
		if (this.value == null || typeof(this.value) == 'undefined') return "";
		return (this.value + "").replace(/\<.*\>/g, ' ');
	};
	formatDate ()	{
		if (!this.value) return "";
		var date = this.value;
		return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
	};
	formatDateTime ()	{
		if (!this.value) return "";
		var date = new Date(this.value);
		return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " +
			    date.toTimeString().replace(/ .*/, '');
	};
	formatPercent () {
		if(!this.value) return "";
		return Math.round(this.value * 100) + "%";
	};
	formatPercentOneDecimal () {
		if(!this.value) return "";
		return Math.round(this.value * 1000) / 10 + "%";
	};
	formatPercentTwoDecimal () {
		if(!this.value) return "";
		return Math.round(this.value * 10000) / 100 + "%";
	};
	formatPercentNS () {
		if(!this.value) return "";
		return Math.round(this.value * 100);
	};
	formatDollar (prependSymbol) {
		if(this.value == null || this.value == 0) return "";
		return this.formatCurrencyZero("$");
	};
	formatDollarRounded (prependSymbol) {
		if(this.value == null || this.value == 0) return "";
		this.value = Math.round(this.value);
		return this.formatCurrencyZero("$");
	};
	formatCurrency (prependSymbol) {
		if(this.value == null || this.value == 0) return "";
		return this.formatCurrencyZero("");
	};
	formatCurrencyZero (prependSymbol) {
		if(this.value == null) return "";
		return this.formatCurrencyInternal(this.value, prependSymbol);
	};
	formatCurrencyCents (prependSymbol) {
		if(this.value == null || this.value == 0) return "";
		return this.formatCurrencyInternal(this.value, "", true);
	};
	formatCurrencyInternal (value, prependSymbol?, noround?) {
		prependSymbol = (prependSymbol || prependSymbol == "" ? prependSymbol : "$") + "";

		if (noround)
			var n = value + "";
		else
			var n = Math.round(value) + "";

		n = n.replace(/\.([0-9])$/, ".$10");
		var p = value < 0 ? ['(', ')'] : ['', ''];
		return p[0] + prependSymbol + this.addCommas(n.replace(/-/, '')) + p[1];
	};
	formatCurrencyFree (prependSymbol) {
		if(this.value == null || this.value==0) return "FREE";
		if(this.value < 0) return "TBD";
		return this.formatCurrencyZero(prependSymbol);
	};
	formatRank () {
		if(this.value == null) return "";
		var lastDigit = (this.value + "").substr(this.value.length - 1);
		switch (lastDigit) {
			case '1': return this.value + 'st';
			case '2': return this.value + 'nd';
			case '3': return this.value + 'rd';
			default: return this.value + 'th';
		}
	};
	formatMillionBillion () {
		if(this.value == null) return "";
		var value = this.value.replace(/[,\$ ]/, '') * 1;
		if (value >= 1000000000)
			return this.formatCurrencyInternal(Math.round((value + 500000000) / 10000000) / 100, '$', true) + "B";
		else if (value >= 1000000)
			return this.formatCurrencyInternal(Math.round((value + 500000) / 10000) / 100, '$', true) + "M";
		else
			return this.formatCurrencyInternal(value, '$');
	};
	format100K () {
		if(this.value == null)
			return "";
		this.value = this.value + "";
		var value : any = this.value.replace(/[,\$ ]/, '') * 1;
		if (value >= 1000000)
			return this.formatSingleDecimalInternal(Math.round(value / 100000) / 10, '$') + "m";
		else
			return this.formatSingleDecimalInternal(Math.round(value / 100) / 10, '$') + "k";
	};
	formatSingleDecimalInternal (value, prependSymbol) {
		prependSymbol = (prependSymbol || prependSymbol == "" ? prependSymbol : "$") + "";
		var n = Math.round(value * 10) / 10 + "";
		var p = value < 0 ? ['(', ')'] : ['', ''];
		return p[0] + prependSymbol + this.addCommas(n.replace(/-/, '')) + p[1];
	};
	formatNumber () {
		if(this.value == null) return "";
		return this.addCommas(this.value);
	};

    clientInit ()
    {
    	/*
        this.attr(".currency", {format: this.formatDollar});
        this.attr(".spin", {min: "{prop.min}", max: "{prop.max}"});
        this.rule("text", {maxlength: "{prop.length}", validate: this.isText, format: this.formatText});
        this.rule("numeric", {parse: this.parseNumber, format: this.formatText});
        this.rule("name", {maxlength: "{prop.length}", validate: this.isName});
        this.rule("email", {validate: this.isEmail});
        this.rule("currency", {format:this.formatDollar, parse: this.parseCurrency});
        this.rule("currencycents", {format:this.formatCurrencyCents, parse: this.parseCurrency});
        this.rule("date", {format: this.formatDate, parse: this.parseDate});
        this.rule("datetime", {format: this.formatDateTime, parse: this.parseDate});
        this.rule("DOB", {format: this.formatDate, parse: this.parseDOB});
        this.rule("SSN", {validate: this.isSSN});
        this.rule("taxid", {validate: this.isTaxID});
        this.rule("phone", {validate: this.isPhone});
        this.rule("required", {validate: this.notEmpty});
        this.rule("percent", {validate: this.isPercent, format: this.formatPercent});
        this.rule("zip5", {validate: this.isZip5});
        */
    };

    // Utility
	addCommas  (nStr)	{
		nStr += '';
		var x = nStr.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	};
	mustNotMatch (regex, error) {
		if (this.value != null && this.value.length > 0 && (this.value + "").match(regex))
			throw error ? {message: error} : " Incorrect Format";
	};
	mustMatch (regex, error) {
		if (this.value != null && this.value.length > 0 && !(this.value + "").match(regex))
			throw error ? {message: error} : " Incorrect Format";
	};
	serverLog  (text) {
		console.log(text);
		if (this.errorCount < 3)
			this.xhr("/log", "text/plain", text, this, function () {});
	};
	getModalLeft  (dialogWidth) {
		var element : any = window
		var attr = 'inner';
		if (!('innerWidth' in window )) {
			attr = 'client';
			element = document.documentElement || document.body;
		}
		return Math.round(element[attr + 'Width'] / 2 - dialogWidth / 2);
	};
	getModalTop  (dialogHeight) {
		var element : any = window
		var attr = 'inner';
		if (!('innerHeight' in window )) {
			attr = 'client';
			element = document.documentElement || document.body;
		}
		return Math.round(element[attr + 'Height'] / 2 - dialogHeight / 2);
	};
    /**
     * Client is to expire, either reset or let infrastructure hande it
     *
     * @return {Boolean} - true if reset handled within controller, false to destroy/create controller
     */
    clientExpire () {
        return false;
    };


    /**
	 * Send an XMLHTTPREQUEST for get or put
	 * @param url
	 * @param contentType
	 * @param data - will do a put if not null
	 * @param callbackobj
	 * @param callbackfn
	 */
	xhr  (url, contentType, data, callbackobj, callbackfn, errcallbackobj?, errcallbackfn?)
	{
		var request = this.getxhr();
		request.open(data ? 'PUT' : 'GET', url, true);
		request.setRequestHeader("Content-type", contentType);
		var self = this;
		request.onreadystatechange = function () {
			var status : any;
			var statusText : any;
			if (request.readyState != 4)
				return;
			try {
				status = request.status;
				statusText = request.statusText;
			} catch (e) {
				status = '666';
				statusText = 'unknown';
			}
			if (status == 200) {
				self.errorCount = 0;
				callbackfn.call(callbackobj, request);
			} else {
				++self.errorCount;
				var error = "Server request failed\nurl: " + url + "\nstatus: " +  statusText + "\nmessage:" + request.responseText;
				if (errcallbackfn)
					errcallbackfn.call(errcallbackobj, request, error);
				else
					if (self.errorCount < 3)
						alert(error);
			}
		}
		request.send(data);
	};
	getxhr () {
		try {
			return new XMLHttpRequest();
		} catch (e) {
			try {
				return new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e2) {
				try {
					return new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e3) {
					throw 'No support for XMLHTTP';
				}
			}
		}
	};
    loadScript (src, then) {
        var head= document.getElementsByTagName('head')[0];
        var script : any = document.createElement('script');
        var thenFunction = then;
        var self = this;
        script.type= 'text/javascript';
        script.src= src;
        if (then) {
            if(document.all) {
                script.onreadystatechange = function() {
                    if (script.readyState == 'complete')
                        script.onreadystatechange = "";
                    else if (script.readyState == 'loaded')
                        script.onreadystatechange = "";
                    thenFunction.call(self);
                }
            }
            else
                script.onload = function() {
                    thenFunction.call(self);
                }
        }
        head.appendChild(script);
    }

}