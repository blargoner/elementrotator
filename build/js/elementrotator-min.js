(function(){var G=YAHOO.lang,E=YAHOO.util.Dom,C=YAHOO.util.Element,B=YAHOO.util.Cookie,D=YAHOO.util.Anim;function A(J,I){I=I||{};A.superclass.constructor.call(this,J,I);this._elements=[];this._current=0}A._CONFIG_DEFAULTS={SHOW_DURATION:{key:"show_duration",value:5},FADE_DURATION:{key:"fade_duration",value:1},CLOCK_SYNC:{key:"clock_sync",value:false},COOKIE_PERSIST:{key:"cookie_persist",value:false},COOKIE_NAME:{key:"cookie_name",value:"elementrotator"},COOKIE_SETTINGS:{key:"cookie_settings",value:{path:"/"}}};A._COOKIES={CURRENT:"current"};var F=A._CONFIG_DEFAULTS,H=A._COOKIES;G.extend(A,C,{initAttributes:function(I){A.superclass.initAttributes.call(this,I);this.setAttributeConfig(F.SHOW_DURATION.key,{value:F.SHOW_DURATION.value,validator:G.isNumber});this.setAttributeConfig(F.FADE_DURATION.key,{value:F.FADE_DURATION.value,validator:G.isNumber});this.setAttributeConfig(F.CLOCK_SYNC.key,{value:F.CLOCK_SYNC.value,validator:G.isBoolean});this.setAttributeConfig(F.COOKIE_PERSIST.key,{value:F.COOKIE_PERSIST.value,validator:G.isBoolean});this.setAttributeConfig(F.COOKIE_NAME.key,{value:F.COOKIE_NAME.value,validator:G.isString});this.setAttributeConfig(F.COOKIE_SETTINGS.key,{value:F.COOKIE_SETTINGS.value,validator:G.isObject});this.setAttributes(I,true)},_initCurrent:function(){if(this.get(F.COOKIE_PERSIST.key)){var I=this.get(F.COOKIE_NAME.key),J=B.getSub(I,H.CURRENT,Number);if(J){this._current=J}}return this._current},_advanceCurrent:function(){this._current=(this._current+1)%this._elements.length;if(this.get(F.COOKIE_PERSIST.key)){B.setSub(this.get(F.COOKIE_NAME.key),H.CURRENT,this._current,this.get(F.COOKIE_SETTINGS.key))}return this._current},_schedule:function(){var I=this,K=1000*this.get(F.SHOW_DURATION.key),J=this.get(F.CLOCK_SYNC.key)?(K-((new Date()).getTime()%K)):K;setTimeout(function(){I._advance()},J)},_advance:function(){var I=this,N=this._elements,K=N.length,P=this._current,M=(P+1)%K,O=N[P],J=N[M],L;if(M!==0){L=new D(J,{opacity:{to:1}},this.get(F.FADE_DURATION.key));L.onComplete.subscribe(function(){E.setStyle(O,"opacity",0);E.setStyle(O,"visibility","hidden");I._schedule()});E.setStyle(J,"visibility","visible")}else{L=new D(O,{opacity:{to:0}},this.get(F.FADE_DURATION.key));L.onComplete.subscribe(function(){E.setStyle(O,"visibility","hidden");I._schedule()});E.setStyle(J,"visibility","visible");E.setStyle(J,"opacity",1)}this._advanceCurrent();L.animate()},render:function(){var M=this.get("element"),J=M.childNodes,I=J.length;if(I){var P=E.getStyle(M,"position"),O=this._initCurrent(),L,K,N;if(!P||P==="static"){E.setStyle(M,"position","relative")}this._elements=[];for(L=K=0;L<I;L++){N=J[L];if(N.nodeType===1){E.setStyle(N,"position","absolute");E.setStyle(N,"left",0);E.setStyle(N,"top",0);E.setStyle(N,"zIndex",K);E.setStyle(N,"visibility",K===O?"visible":"hidden");E.setStyle(N,"opacity",K++===O?1:0);this._elements.push(N)}}if(this!==1){this._schedule()}}}});YAHOO.namespace("BLARGON.widget");YAHOO.BLARGON.widget.ElementRotator=A})();