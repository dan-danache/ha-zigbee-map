var D=()=>crypto.randomUUID?.()||"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,r=>{var e=Math.random()*16|0,t=r=="x"?e:e&3|8;return t.toString(16)}),f=class{constructor(){this.taps={},this.pendingReplies=[]}tap(e,t){(this.taps[e]||=[]).push(t)}relay(e,t){this.taps[e]?.forEach(s=>queueMicrotask(()=>s(t)));for(let s=0;s<this.pendingReplies.length;s++){let{filter:i,resolve:o,timer:a}=this.pendingReplies[s];if(i(e,t)){clearTimeout(a),o({eventName:e,payload:t}),this.pendingReplies.splice(s,1);break}}}async command(e,t,s,i=1e4){e&&this.relay(e,t);let o=D();return new Promise((a,u)=>{let c=setTimeout(()=>this.#e(o),i);this.pendingReplies.push({id:o,filter:s,timeout:i,resolve:a,reject:u,timer:c})})}#e(e){for(let t=0;t<this.pendingReplies.length;t++){let{id:s,timeout:i,reject:o}=this.pendingReplies[t];if(s===e){o(new Error(`timeout: ${i}ms \u2014 trace: ${s}`)),this.pendingReplies.splice(t,1);return}}}};var d=class{constructor(e){this.bus=e,this.messages=[]}start(e){let t=this.messages.push({status:"pending",message:e})-1;return this.#e({done:(s,i)=>(this.messages[t].status="ok",this.messages[t].feedback=s,this.#e(i??s)),fail:(s,i)=>(this.messages[t].status="fail",this.messages[t].feedback=s,this.#e(i??s))})}info(e,t){this.messages.push({status:"info",message:e,feedback:t}),this.#e()}warn(e,t){this.messages.push({status:"warn",message:e,feedback:t}),this.#e()}async record(e,t){let s=this.start(e);try{return await t(s)}catch(i){let o=i instanceof Error?i.message:JSON.stringify(i);throw s.fail(o),i}}static shorten(e){return typeof e!="string"||e.length<32?e:`${e.slice(0,16)}...${e.slice(-16)}`}#e(e){return this.bus.relay("log-entries",this.messages),e}};var v=class{constructor(e,t){this.bus=e,this.log=t,this.config=null,this.hass=null}async start(e,t,s,i){console.info(`%c ${s} %c v${i} `,"color: white; background: #d33682; font-weight: 700;","color: #d33682; background: white; font-weight: 700;"),this.config=e,this.hass=t,await this.#e(),this.bus.relay("ui-ready"),await this.log.record("Becoming mindful",c=>{if(!t)throw new Error("Failed to get current state of Home Assistant (this.hass)");c.done(`trapped inside HA/${t.config?.version}`)});let o=e["websocket-url"];if(o){this.log.info("Using user-defined websocket",d.shorten(o)),this.bus.relay("websocket-url",o);return}let a=e.slug;if(a)this.log.info("Using user-defined slug",a);else{let c=await this.log.record("Probing system supervisor",async n=>{let l=await t.callWS({type:"supervisor/api",endpoint:"/addons",method:"get"});return n.done(`scan complete: ${l.addons.length} addons detected`,l.addons)});a=await this.log.record("Analyzing Zigbee2MQTT / Proxy",async n=>{let{slug:l,version:U}={...c.find(N=>N.name.startsWith("Zigbee2MQTT")&&N.state==="started")};if(l===void 0)throw new Error("addon not installed");return n.done(`binding slug confirmed: ${l}/${U}`,l)})}let u=await this.log.record("Tracing ingress tunnel",async c=>{let n=await t.callWS({type:"supervisor/api",endpoint:`/addons/${a}/info`,method:"get"});return c.done(`route stabilized: ${d.shorten(n.ingress_entry.split("/").pop())}`,n.ingress_entry)});await this.log.record("Acquiring ingress session",async c=>{let n=await t.callWS({type:"supervisor/api",endpoint:"/ingress/session",method:"post",id:3});return document.cookie=`ingress_session=${n.session}; path=/api/hassio_ingress/; SameSite=Strict`,await new Promise(l=>setTimeout(l,1e3)),c.done(`handshake accepted: ${d.shorten(n.session)}`,n.session)}),o=`ws${t.hassUrl().substring(4).replace(/\/$/,"")}${u}/api`,this.bus.relay("websocket-url",o)}async#e(){if(customElements.get("ha-top-app-bar-fixed"))return;await customElements.whenDefined("partial-panel-resolver"),await document.createElement("partial-panel-resolver")._getRoutes([{component_name:"config",url_path:"a"}])?.routes?.a?.load?.(),await customElements.whenDefined("ha-panel-config");let s=document.createElement("ha-panel-config");await s?.routerOptions?.routes?.dashboard?.load?.(),await customElements.whenDefined("ha-config-dashboard"),await s?.routerOptions?.routes?.entities?.load?.(),await customElements.whenDefined("ha-data-table")}};var y=class{constructor(e,t,s,i,o,a,u,c,n,l){this.zigbee=e,this.mqtt=t,this.state=s,this.publishEntityState=i,this.eventBus=o,this.logger=l,this.lqiRequestTopic=`${n.get().mqtt.base_topic}/bridge/request/lqi`,this.lqiResponseTopic="bridge/response/lqi"}start(){this.logger.info("ZigbeeMapExtension: Starting extension"),this.eventBus.onMQTTMessage(this,this.onMQTTMessage.bind(this))}stop(){this.logger.info("ZigbeeMapExtension: Stopping extension"),this.eventBus.removeListeners(this)}onMQTTMessage(e){if(e.topic===this.lqiRequestTopic)try{let t=JSON.parse(e.message),{ieeeAddr:s}=t;if(typeof s!="string"||!s.startsWith("0x")){this.logger.warning(`ZigbeeMapExtension: Invalid LQI request for '${s}'`);return}this.processLqiRequest(t)}catch(t){this.logger.error(`ZigbeeMapExtension: Failed to parse payload JSON: ${t.message}`)}}async processLqiRequest(e){let{ieeeAddr:t}=e,s=this.zigbee.resolveEntity({ieeeAddr:t});if(s===void 0||s.options.disabled||!s.interviewed){this.logger.warning(`ZigbeeMapExtension: Skipping LQI request for '${t}', device invalid or not ready`);return}let i=async o=>{try{return await o()}catch{return await new Promise(a=>setTimeout(a,5e3)),await o()}};try{let o=await i(async()=>await s.zh.lqi());await this.sendLqiResponse(e,s,o)}catch(o){this.logger.error(`ZigbeeMapExtension: Failed to execute LQI for '${s.name}' (${t})`),this.logger.debug(o.stack)}}async sendLqiResponse(e,t,s){try{let i=JSON.stringify({transaction:e.transaction,ieeeAddr:e.ieeeAddr,name:t.name,type:t.zh.type,neighbors:s.neighbors??s});await this.mqtt.publish(this.lqiResponseTopic,i)}catch(i){this.logger.error(`ZigbeeMapExtension: Failed to publish LQI response: '${i.message}'`)}}};var x=class{constructor(e,t,s,i,o,a,u,c,n,l){this.zigbee=e,this.mqtt=t,this.state=s,this.publishEntityState=i,this.eventBus=o,this.logger=l,this.publishTopic="bridge/zigbee-log"}start(){this.logger.info("ZigbeeLogExtension: Starting extension"),this.eventBus.onDeviceMessage(this,this.onDeviceMessage.bind(this))}stop(){this.logger.info("ZigbeeLogExtension: Stopping extension"),this.eventBus.removeListeners(this)}async onDeviceMessage(e){try{let t=JSON.stringify({addr:e.device.zh.ieeeAddr,ep:e.endpoint.ID,tx:e.meta.zclTransactionSequenceNumber,type:e.type,cluster:e.cluster,data:e.data,lqi:e.linkquality});await this.mqtt.publish(this.publishTopic,t)}catch(t){this.logger.error(`ZigbeeLogExtension: Failed to publish message: ${t.message}`)}}};var w=class{constructor(e,t,s){this.bus=e,this.log=t,this.ext=s,this.socket=null,this.pendingReplies=[],e.tap("websocket-url",i=>this.start(i)),e.tap("deploy-zigbee-extension-request",()=>this.#s()),e.tap("remove-zigbee-extension-request",()=>this.#o()),e.tap("query-device-lqi-request",i=>this.#a(i))}async start(e){await this.log.record("Tethering to Zigbee2MQTT",async t=>t.done(`anchor dropped: ${d.shorten(e)}`,await this.#e(e))),await this.log.record("Injecting extension into Zigbee2MQTT",async t=>{let{payload:s}=await this.bus.command("deploy-zigbee-extension-request",null,i=>i==="deploy-zigbee-extension-response");if(!s.status==="ok")throw new Error(s);t.done("payload: delivered \u2014 command channel open")})}send(e,t){let s=JSON.stringify({topic:e,payload:t});this.socket.send(s)}async stop(){if(this.socket!==null){try{await this.log.record("Removing extension from Zigbee2MQTT",async e=>{let{payload:t}=await this.bus.command("remove-zigbee-extension-request",null,s=>s==="remove-zigbee-extension-response");if(!t.status==="ok")throw new Error(t);e.done("payload: removed \u2014 command channel closed")})}catch(e){console.log("Error while removing Z2M extension - ignored",e)}this.socket.close(1e3,"User navigated away")}}async#e(e){return new Promise((t,s)=>{try{this.socket=new WebSocket(e),this.socket.onmessage=i=>this.#t(i)}catch(i){return s(new Error(`websocket creation failed: ${i.message}`))}this.socket.onopen=async()=>{if(await new Promise(i=>setTimeout(i,1e3)),this.socket.readyState===WebSocket.OPEN)t(this.socket);else{let i={0:"connecting",1:"open",2:"closing",3:"closed"}[this.socket.readyState]||"unknown";s(new Error(`invalid websocket.readyState after initial connection: ${i}`))}},this.socket.onerror=i=>{console.error(i),s(new Error("websocket failed to connect"))}})}#t(e){let{topic:t,payload:s}=JSON.parse(e.data);for(let i=0;i<this.pendingReplies.length;i++){let{filter:o,resolve:a}=this.pendingReplies[i];if(o(t,s)){a({topic:t,payload:s}),this.pendingReplies.splice(i,1);break}}switch(t){case"bridge/devices":{let i=s.map(a=>({name:a.friendly_name,addr:a.ieee_address,type:a.type==="Router"?"Repeater":a.type,vendor:a.definition?.vendor,description:a.definition?.description,model:a.definition?.model,summary:`${a.definition?.vendor} ${a.definition?.description}${a.definition?.model?` | ${a.definition?.model}`:""}`})).sort((a,u)=>a.name.localeCompare(u.name));this.bus.relay("device-list",i);let o=i.find(a=>a.type==="Coordinator");o&&this.bus.relay("zigbee-coordinator",o);return}case"bridge/response/extension/save":return this.bus.relay("deploy-zigbee-extension-response",s);case"bridge/response/extension/remove":return this.bus.relay("remove-zigbee-extension-response",s);case"bridge/response/lqi":return this.bus.relay("query-device-lqi-response",s);case"bridge/zigbee-log":return this.bus.relay("zigbee-message",s)}}#s(){let e=this.#i();this.send("bridge/request/extension/save",{name:`${this.ext}.js`,code:e})}#i(){switch(this.ext){case"zigbee-map-extension":return`export default class ZigbeeMapExtension ${y.toString().replace(/^class/,"")}`;case"zigbee-log-extension":return`export default class ZigbeeLogExtension ${x.toString().replace(/^class/,"")}`}}#o(){this.send("bridge/request/extension/remove",{name:`${this.ext}.js`})}#a(e){this.send("bridge/request/lqi",{ieeeAddr:e})}};var z=Object.getPrototypeOf(customElements.get("ha-panel-lovelace")),h=z.prototype.html,j=z.prototype.css,q=class extends z{static get properties(){return{hass:{type:Object},bus:{type:Object},_logEntries:{type:Array}}}constructor(){super(),this._logEntries=[],this._consoleElm=null}firstUpdated(e){super.firstUpdated(e),this._consoleElm=this.renderRoot.querySelector("ul"),this.bus.tap("log-entries",t=>this._updateLogEntries(t))}render(){return h`
            <ul>
                ${this._logEntries.map(e=>h`
                        <li>
                            ${this._renderStatusIcon(e.status)}
                            ${e.message}${e.feedback?h` <span class="feedback"> # ${e.feedback}</span>`:""}
                        </li>
                    `)}
            </ul>
        `}_updateLogEntries(e){this._logEntries=[...e],queueMicrotask(()=>this._consoleElm.scrollIntoView({behavior:"smooth",block:"end"}))}_renderStatusIcon(e){switch(e){case"pending":return h`<span class="st pending">[ .... ]</span>`;case"ok":return h`<span class="st ok">[ DONE ]<span></span></span>`;case"fail":return h`<span class="st fail">[ FAIL ]</span>`;case"info":return h`<span class="st info">[ INFO ]</span>`;case"warn":return h`<span class="st warn">[ WARN ]</span>`;default:return h`<span class="st">[ ???? ]</span>`}}static get styles(){return j`
            :host {
                display: block;
                height: 100%;
            }

            ul {
                display: block;
                list-style-type: none;
                padding: 10px;
                margin: 0;
                font-family: monospace;
                font-size: smaller;
            }
            li {
                white-space: nowrap;
            }
            .st {
                white-space: pre;
            }
            .st.pending {
                color: #839496;
            }
            .st.ok {
                color: var(--Green);
            }
            .st.fail {
                color: var(--Red);
            }
            .st.info {
                color: var(--Blue);
            }
            .st.warn {
                color: var(--Orange);
            }
            .feedback {
                opacity: 0.5;
            }
        `}};customElements.get("console-list")||customElements.define("console-list",q);var _=Object.getPrototypeOf(customElements.get("ha-panel-lovelace")),g=_.prototype.html,I=_.prototype.css,$=_.prototype.nothing,M=class extends _{static get properties(){return{name:{type:String},count:{type:Number},seen:{type:Boolean},curr:{type:Boolean}}}render(){return g`<span title=${this.name}>${this.curr?"\u25B6 ":$}${this.name}</span>
            <aside ?new=${!this.seen}>${this.count}</aside>`}static get styles(){return I`
            :host {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                line-height: 1rem;
                user-select: none;
            }
            span {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            aside {
                background-color: var(--primary-color);
                color: var(--text-primary-color);
                border-radius: var(--ha-border-radius-lg);
                padding: 4px 8px;
                min-width: 20px;
                text-align: center;
                font-size: 0.9em;
            }
            aside[new] {
                background-color: var(--accent-color);
            }
        `}},T=class extends _{static get properties(){return{hass:{type:Object},devices:{type:Array},_filter:{type:String},_sortColumn:{type:String},_sortDirection:{type:String},_selectedDeviceAddr:{type:String}}}constructor(){super(),this.devices=[],this._filter="",this._sortColumn="count",this._sortDirection="desc",this._selectedDeviceAddr="",this._columns={name:{title:"Name",main:!0,sortable:!0,filterable:!0,template:e=>g`
                    <device-row
                        .name=${e.name}
                        .count=${e.count}
                        .seen=${e.seen}
                        .curr=${e.addr===this._selectedDeviceAddr}
                    ></device-row>
                `},count:{title:"Count",sortable:!0,hidden:!0,template:e=>e.count}}}render(){let e=g`<search-input-outlined
            .hass=${this.hass}
            .label=${"Search"}
            .filter=${this._filter}
            .placeholder=${"Search"}
            @value-changed=${this.#e}
        ></search-input-outlined>`,t=Object.values(this._columns).find(s=>s.sortable)?g`
                  <ha-md-button-menu positioning="popover">
                      <ha-assist-chip slot="trigger" .label=${`Sort: ${this._columns[this._sortColumn].title}`}>
                          <ha-icon slot="trailing-icon" .icon=${"mdi:menu-down"}></ha-icon>
                      </ha-assist-chip>
                      ${Object.entries(this._columns).map(([s,i])=>i.sortable?g`
                                    <ha-md-menu-item
                                        class=${s===this._sortColumn?"selected":$}
                                        keep-open
                                        .value=${s}
                                        .selected=${s===this._sortColumn}
                                        @click=${this.#t}
                                        @keydown=${this.#t}
                                    >
                                        ${this._sortColumn===s?g`
                                                  <ha-icon
                                                      slot="end"
                                                      .icon=${this._sortDirection==="desc"?"mdi:arrow-down":"mdi:arrow-up"}
                                                  ></ha-icon>
                                              `:$}
                                        ${i.title||i.label}
                                    </ha-md-menu-item>
                                `:$)}
                  </ha-md-button-menu>
              `:$;return g`
            <ha-data-table
                .hass=${this.hass}
                .narrow=${!0}
                .data=${this.devices}
                .columns=${this._columns}
                .filter=${this._filter}
                .sortColumn=${this._sortColumn}
                .sortDirection=${this._sortDirection}
                id="addr"
                clickable
                @row-click=${this.#s}
            >
                <div slot="header">
                    <slot name="top-header"></slot>
                </div>
                <div slot="header-row" class="narrow-header-row">${e}${t}</div>
            </ha-data-table>
        `}#e(e){this._filter!==e.detail.value&&(this._filter=e.detail.value)}#t(e){if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;let t=e.currentTarget.value;this._sortDirection=this._sortColumn!==t||this._sortDirection==="desc"?"asc":"desc",this._sortColumn=t}#s(e){let t=e.detail.id;t!==this._selectedDeviceAddr&&(this._selectedDeviceAddr=this.devices.find(s=>s.addr===t)?.addr,this.dispatchEvent(new CustomEvent("device-select",{bubbles:!0,composed:!0,detail:{addr:this._selectedDeviceAddr}})))}static get styles(){return I`
            :host {
                display: block;
                height: 100%;
            }

            .narrow-header-row {
                display: flex;
                align-items: center;
                min-width: 100%;
                gap: var(--ha-space-4);
                padding: 0 8px;
                box-sizing: border-box;
                overflow-x: scroll;
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            .narrow-header-row .flex {
                flex: 1;
                margin-left: -16px;
            }

            ha-data-table {
                --ha-border-radius-sm: var(--ha-border-radius-square);
                border-left: 0;
            }

            @media (max-width: 600px) {
            }
        `}};customElements.get("device-row")||customElements.define("device-row",M);customElements.get("devices-list")||customElements.define("devices-list",T);var L=Number.isNaN||function(e){return typeof e=="number"&&e!==e};function Q(r,e){return!!(r===e||L(r)&&L(e))}function G(r,e){if(r.length!==e.length)return!1;for(var t=0;t<r.length;t++)if(!Q(r[t],e[t]))return!1;return!0}function Z(r,e){e===void 0&&(e=G);var t=null;function s(){for(var i=[],o=0;o<arguments.length;o++)i[o]=arguments[o];if(t&&t.lastThis===this&&e(i,t.lastArgs))return t.lastResult;var a=r.apply(this,i);return t={lastResult:a,lastArgs:i,lastThis:this},a}return s.clear=function(){t=null},s}var S=Object.getPrototypeOf(customElements.get("ha-panel-lovelace")),p=S.prototype.html,F=S.prototype.css,W=S.prototype.nothing,m={Coordinator:{icon:"mdi:memory",color:"var(--Orange)"},Repeater:{icon:"mdi:access-point",color:"var(--Blue) "},EndDevice:{icon:"mdi:battery-high",color:"var(--Green)"}};function C(r){return new Date(r).toTimeString().slice(0,8)}function k(r){return r?r.replace(/([A-Z])/g," $1").replace(/^./,e=>e.toUpperCase()).replace("Gen ","").replace("Ha ","").replace("Ms ","").replace("Ss ","").replace("Ota","OTA Upgrade").replace("Ias","IAS"):"--"}function J(r){return JSON.stringify(r,null,2).slice(1,-1).trim().replaceAll('"',"").replace(/\n  /g,`
`).replace(/,\n/g,`
`)}var O=class extends S{static get properties(){return{hass:{type:Object},narrow:{type:Boolean,reflect:!0},messages:{type:Array},filter:{type:String},_sortColumn:{type:String},_sortDirection:{type:String},_selectedMessage:{type:Object}}}constructor(){super(),this.messages=[],this.filter="",this._sortColumn="time",this._sortDirection="asc",this._selectedMessage=null,this._columns=Z(e=>e?{addr:{filterable:!0,hidden:!0,template:t=>t.addr},time:{title:"Timestamp (hidden)",sortable:!0,hidden:!0,template:t=>t.time},icon:{title:"Type",type:"icon",main:!0,template:t=>p`<ha-icon
                                  .icon=${m[t.deviceType]?.icon}
                                  style="margin:0; color:${m[t.deviceType]?.color}"
                              ></ha-icon>`},type:{title:"Zigbee message",main:!0,sortable:!0,filterable:!0,template:t=>p`
                              ${t.deviceName}
                              <div class="secondary">${C(t.time)}: ${k(t.type)}</div>
                          `}}:{addr:{filterable:!0,hidden:!0,template:t=>t.addr},time:{title:"Time",type:"icon",main:!0,sortable:!0,flex:2,template:t=>C(t.time)},icon:{title:"Device type",type:"icon",main:!0,template:t=>p`<ha-icon
                                  .icon=${m[t.deviceType]?.icon}
                                  style="margin:0; color:${m[t.deviceType]?.color}"
                              ></ha-icon>`},deviceName:{title:"Device",sortable:!0,filterable:!0,flex:4,template:t=>p`${t.deviceName}
                                  <div class="secondary">endpoint: ${t.ep}</div>`},type:{title:"Type",main:!0,sortable:!0,filterable:!0,flex:8,template:t=>p`${k(t.type)}
                                  <div class="secondary">cluster: ${k(t.cluster)}</div>`},tx:{title:"LQI",main:!0,flex:1,template:t=>p`<div style="text-align:right">TX:${t.tx}</div>
                                  <div class="secondary" style="text-align:right">LQI:${t.lqi}</div>`}})}render(){let e=p`
            <ha-assist-chip id="devices-button" .label=${"Devices list"} @click=${this.#e}>
                <ha-icon slot="icon" icon="mdi:menu"></ha-icon>
            </ha-assist-chip>
        `,t=s=>{if(s===null)return W;let i=this._getPrevMessage(s.id),o=this._getNextMessage(s.id);return p`
                <ha-dialog open .heading=${k(s.type)} @closed=${this.#i}>
                    <table>
                        <tr>
                            <td>Time :</td>
                            <td>${C(s.time)}</td>
                        </tr>
                        <tr>
                            <td>Device :</td>
                            <td>
                                <ha-icon
                                    .icon=${m[s.deviceType]?.icon}
                                    style="margin:0; color:${m[s.deviceType]?.color}"
                                ></ha-icon>
                                ${s.deviceName}
                            </td>
                        </tr>
                        <tr>
                            <td>Addr :</td>
                            <td>${s.addr?.toUpperCase().replace("X","x")}</td>
                        </tr>
                        <tr>
                            <td>Endpoint :</td>
                            <td>${s.ep}</td>
                        </tr>
                        <tr>
                            <td>Cluster :</td>
                            <td>${k(s.cluster)}</td>
                        </tr>
                        <tr>
                            <td>Sequence:</td>
                            <td>${s.tx}</td>
                        </tr>
                        <tr>
                            <td>LQI :</td>
                            <td>${s.lqi}</td>
                        </tr>
                        <tr>
                            <td>Data :</td>
                            <td class="data">${J(s.data)}</td>
                        </tr>
                    </table>
                    <ha-button ?disabled=${i===null} appearance="plain" @click=${()=>this._selectedMessage=i} slot="secondaryAction"
                        >&lt; Prev</ha-button
                    >
                    <ha-button ?disabled=${o===null} appearance="plain" @click=${()=>this._selectedMessage=o} slot="secondaryAction"
                        >Next &gt;</ha-button
                    >
                    <ha-button slot="primaryAction" @click=${this.#i}>Close</ha-button>
                </ha-dialog>
            `};return p`
            <ha-data-table
                .hass=${this.hass}
                .narrow=${this.narrow}
                .data=${this.messages}
                .columns=${this._columns(this.narrow)}
                .filter=${this.filter}
                .sortColumn=${this._sortColumn}
                .sortDirection=${this._sortDirection}
                id="id"
                clickable
                @row-click=${this.#s}
            >
                <div slot="header">
                    <slot name="top-header"></slot>
                </div>
                <div slot="header-row" class="narrow-header-row">
                    ${e}
                    <search-input-outlined
                        .hass=${this.hass}
                        .label=${"Search"}
                        .filter=${this.filter}
                        .placeholder=${`Search ${this.messages.length} messages`}
                        @value-changed=${this.#t}
                    ></search-input-outlined>
                </div>
            </ha-data-table>
            ${t(this._selectedMessage)}
        `}#e(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent("devices-button-click",{bubbles:!0,composed:!0,detail:{}}))}#t(e){this.filter!==e.detail.value&&(this.filter=e.detail.value)}#s(e){let t=this.messages.find(s=>s.id===e.detail.id);this._selectedMessage=t}#i(){this._selectedMessage=null}_getPrevMessage(e){let t=this.messages.findIndex(s=>s.id===e);return t>0?this.messages[t-1]:null}_getNextMessage(e){let t=this.messages.findIndex(s=>s.id===e);return t!==-1&&t<this.messages.length-1?this.messages[t+1]:null}static get styles(){return F`
            :host {
                display: block;
                height: 100%;
            }
            .narrow-header-row {
                display: flex;
                align-items: center;
                min-width: 100%;
                gap: var(--ha-space-4);
                padding: 0 8px;
                box-sizing: border-box;
                overflow-x: scroll;
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            .narrow-header-row .flex {
                flex: 1;
                margin-left: -16px;
            }
            search-input-outlined {
                width: 100%;
            }
            table {
                border-spacing: 0;
                width: 100%;
                white-space: nowrap;
            }
            td {
                border-bottom: 1px solid var(--divider-color);
                padding: 2px 10px;
            }
            td:first-child {
                text-align: right;
                font-weight: bold;
                padding-right: 0;
            }
            .data {
                white-space: pre;
            }
            pre {
                font-size: 0.9em;
                line-height: 1.2em;
                margin: 0;
            }

            ha-dialog {
                --justify-action-buttons: space-between;
            }

            ha-data-table {
                --data-table-border-width: 0;
                --ha-border-radius-sm: var(--ha-border-radius-square);
                border-top: 1px solid var(--divider-color);
                height: calc(100% - 1px);
            }

            @media (min-width: 600px) {
                #devices-button {
                    display: none;
                }
                ha-dialog {
                    --mdc-dialog-min-width: 500px;
                }
                td:first-child {
                    width: 8em;
                }
            }
        `}};customElements.get("zigbee-messages-list")||customElements.define("zigbee-messages-list",O);var R=Object.getPrototypeOf(customElements.get("ha-panel-lovelace")),A=R.prototype.html,H=R.prototype.css,E="Zigbee Log",P="2.5.0",B="https://codeberg.org/dan-danache/ha-zigbee-map",V="/src/branch/master/CHANGELOG.md",X="https://www.buymeacoffee.com/dandanache",b=class extends R{static get properties(){return{hass:{type:Object},narrow:{type:Boolean},route:{type:Object},panel:{type:Object},_ready:{type:Boolean},_page:{type:String},_sidebarOpen:{type:Boolean},_devices:{type:Array},_filteredMessages:{type:Array}}}constructor(){super(),console.log("constructor"),this._ready=!1,this._page="console",this._sidebarOpen=!1,this._devices=[],this._filteredMessages=[],this.bus=new f,this.log=new d(this.bus),this.bootstrap=new v(this.bus,this.log),this.websocket=new w(this.bus,this.log,"zigbee-log-extension"),this.bus.tap("ui-ready",()=>this._ready=!0),this.bus.tap("device-list",e=>this.#t(e)),this.bus.tap("deploy-zigbee-extension-response",()=>{this.log.info("Interface rerouted to graphical feed","user engaged with visual decoy"),this._page="log"}),this.bus.tap("zigbee-message",e=>this.#s(e)),this._messages=[],this._selectedDeviceAddr=""}connectedCallback(){super.connectedCallback(),console.log("connectedCallback")}disconnectedCallback(){super.disconnectedCallback(),console.log("disconnectedCallback"),this.websocket.stop()}firstUpdated(e){super.firstUpdated(e),console.log("firstUpdated"),setTimeout(()=>this.bootstrap.start(this.panel?.config,this.hass,"ZIGBEE-LOG-PANEL",P),1e3)}attributeChangedCallback(e,t,s){super.attributeChangedCallback(e,t,s),setTimeout(()=>this.requestUpdate(),0)}render(){return this.hass?this._ready?A`
            <ha-top-app-bar-fixed>
                <ha-menu-button slot="navigationIcon" .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
                <div slot="title" class="header">${E}</div>
                <ha-icon-button slot="actionItems" label="Start again" @click=${()=>document.location.reload()}>
                    <ha-icon class="icon" icon="mdi:refresh"></ha-icon>
                </ha-icon-button>
            </ha-top-app-bar-fixed>

            <div id="toolbar">
                <ha-tab-group @wa-tab-show=${this.#e}>
                    <ha-tab-group-tab slot="nav" panel="log" .active=${this._page==="log"}>Messages</ha-tab-group-tab>
                    <ha-tab-group-tab slot="nav" panel="about" .active=${this._page==="about"}>About</ha-tab-group-tab>
                    <ha-tab-group-tab slot="nav" panel="console" .active=${this._page==="console"}>Console</ha-tab-group-tab>
                </ha-tab-group>
            </div>

            <section id="console-page" ?hidden=${this._page!=="console"}>
                <console-list .bus=${this.bus}></console-list>
            </section>

            <section id="log-page" ?hidden=${this._page!=="log"} ?data-sidebar-open=${this._sidebarOpen}>
                <div id="devices">
                    <devices-list .hass=${this.hass} .devices=${this._devices} @device-select=${this.#a}></devices-list>
                </div>
                <div id="messages" @click=${this.#i}>
                    <zigbee-messages-list
                        .hass=${this.hass}
                        .narrow=${this.narrow}
                        .messages=${this._filteredMessages}
                        @devices-button-click=${this.#o}
                    ></zigbee-messages-list>
                </div>
            </section>

            <section id="about-page" ?hidden=${this._page!=="about"}>
                <ha-card id="about-logo" outlined>
                    <div class="card-content">
                        <div id="about-icon">
                            <ha-icon icon="mdi:list-box-outline"></ha-icon>
                        </div>
                        <div id="about-name">
                            ${E} <small>v${P}</small>
                            <aside>Capture. Inspect. Improve.</aside>
                        </div>

                        <ha-md-list id="about-links">
                            <ha-md-list-item type="link" href="${B}" target="_blank" rel="noopener noreferrer">
                                <div slot="start" class="icon-background" style="background-color: var(--Blue)">
                                    <ha-icon icon="mdi:git"></ha-icon>
                                </div>
                                <span slot="headline">Source code</span>
                                <span slot="supporting-text">Unravel the magic within</span>
                                <ha-icon slot="end" icon="mdi:open-in-new"></ha-icon>
                            </ha-md-list-item>
                            <ha-md-list-item type="link" href="${B}${V}" target="_blank" rel="noopener noreferrer">
                                <div slot="start" class="icon-background" style="background-color: var(--Orange)">
                                    <ha-icon icon="mdi:newspaper-variant"></ha-icon>
                                </div>
                                <span slot="headline">Changelog</span>
                                <span slot="supporting-text">View the latest improvements</span>
                                <ha-icon slot="end" icon="mdi:open-in-new"></ha-icon>
                            </ha-md-list-item>
                            <ha-md-list-item type="link" href="${X}" target="_blank" rel="noopener noreferrer">
                                <div slot="start" class="icon-background" style="background-color: var(--Green)">
                                    <ha-icon icon="mdi:coffee"></ha-icon>
                                </div>
                                <span slot="headline">Buy me a coffee</span>
                                <span slot="supporting-text">Never required, always appreciated</span>
                                <ha-icon slot="end" icon="mdi:open-in-new"></ha-icon>
                            </ha-md-list-item>
                        </ha-md-list>
                    </div>
                </ha-card>

                <ha-card header="How it works" id="how-it-works" outlined>
                    <div class="card-content">
                        <p>
                            ${E} is a custom panel for Home Assistant that connects to the Zigbee2MQTT websocket and provides a real-time view
                            of Zigbee device messages as they are received by the coordinator.
                        </p>
                        <p>
                            The interface is divided into two sections: a sidebar on the left showing all Zigbee devices along with the number of
                            messages each has sent, and a main panel on the right displaying the live message stream. Selecting a device in the
                            sidebar filters the message list to show only messages from that device.
                        </p>
                        <p>
                            ${E} does not store historical data. It displays only messages received while the panel is open. Closing the panel
                            clears all data, making this tool best suited for real-time diagnostics and troubleshooting.
                        </p>
                        <p>
                            Use ${E} to gain insight into your Zigbee mesh, identify devices that generate excessive traffic, and detect
                            potential sources of congestion or instability in the network.
                        </p>
                    </div>
                </ha-card>
            </section>
        `:A`<div class="spinner"></div>`:A`<p>&nbsp;Oh snap... I did it again!</p>`}#e(e){this._page=e.detail.name}#t(e){e.forEach(i=>{i.type!=="Coordinator"&&(this._devices.find(o=>o.addr===i.addr)||this._devices.push({...i,count:0,seen:!0}))});let t=this._devices.filter(i=>i.type==="Repeater").length,s=this._devices.filter(i=>i.type==="EndDevice").length;this.log.info("Mesh topology refreshed",`detected: 1 coordinator, ${t} repeaters, and ${s} end-devices`),this._updateDevicesState()}#s(e){let t=this._devices.find(s=>s.addr===e.addr);t.count++,t.seen=t.addr===this._selectedDeviceAddr,this._messages.push({...e,id:D(),time:new Date().valueOf(),deviceName:t.name,deviceType:t.type}),this._updateDevicesState(),this._updateMessagesState()}#i(e){e.preventDefault(),e.stopPropagation(),this._sidebarOpen=!1}#o(e){e.preventDefault(),e.stopPropagation(),this._sidebarOpen=!0}#a(e){this._selectedDeviceAddr=e.detail.addr,this.#i(e),this._devices.find(t=>t.addr===this._selectedDeviceAddr).seen=!0,this._updateDevicesState(),this._updateMessagesState()}_updateDevicesState(){let e=this._devices.reduce((t,s)=>t+(s.addr===""?0:s.count),0);this._devices[0].addr===""?(this._devices[0].count=e,this._devices[0].seen=this._selectedDeviceAddr===""):this._devices.unshift({name:"All",addr:"",count:e,seen:this._selectedDeviceAddr===""}),this._devices=[...this._devices]}_updateMessagesState(){this._selectedDeviceAddr===""?this._filteredMessages=[...this._messages]:this._filteredMessages=this._messages.filter(e=>e.addr===this._selectedDeviceAddr)}static get styles(){return H`
            :host {
                display: flex;
                flex-flow: column;
                height: 100%;
                font-family: var(--ha-font-family-body);
                font-size: var(--ha-font-size-m);
                font-weight: var(--ha-font-weight-normal);
                line-height: var(--ha-line-height-normal);

                --Yellow: #b58900;
                --Orange: #cb4b16;
                --Red: #dc322f;
                --Magenta: #d33682;
                --Violet: #6c71c4;
                --Blue: #268bd2;
                --Cyan: #2aa198;
                --Green: #859900;
            }

            .spinner {
                position: absolute;
                top: calc(50% - 32px);
                left: calc(50% + (var(--mdc-drawer-width, 0px) / 2) - 32px);

                content: ' ';
                display: block;
                width: 64px;
                height: 64px;
                border-radius: 50%;
                border: 1px solid var(--primary-text-color);
                border-color: var(--primary-text-color) transparent var(--primary-text-color) transparent;
                animation: spinner 1.2s linear infinite;
            }
            @keyframes spinner {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
            ha-top-app-bar-fixed {
                flex: 0 1 auto;
            }
            pre {
                font-size: smaller;
            }
            a {
                color: var(--primary-text-color);
                text-decoration: none;
            }
            ha-tab-group {
                --ha-tab-active-text-color: var(--app-header-text-color, white);
                --ha-tab-indicator-color: var(--app-header-text-color, white);
                --ha-tab-track-color: transparent;
                color: var(--app-header-text-color);
                background-color: var(--app-header-background-color);
                border-bottom: var(--app-header-border-bottom, none);
                -webkit-backdrop-filter: var(--app-header-backdrop-filter, none);
                backdrop-filter: var(--app-header-backdrop-filter, none);
            }
            .card-content *:last-child {
                margin-bottom: 0 !important;
            }
            #toolbar {
                flex: 0 1 auto;
            }

            section {
                flex: 1 1 auto;
                box-sizing: border-box;
                padding: 10px;
                overflow: auto;
            }

            #console-page {
                padding: 0;
            }

            /* ================================================== */

            #log-page {
                padding: 0;
                flex-direction: row;
                position: relative;
            }

            #log-page:not([hidden]) {
                display: flex;
            }

            #devices {
                width: 80%;
                max-width: 300px;
                transition: transform 0.3s ease;
                display: flex;
                flex-direction: column;
                background-color: var(--primary-background-color);
            }

            #messages {
                flex: 1;
                overflow-y: auto;
                position: relative;
                transition: transform 0.3s ease;
            }

            #devices,
            #messages {
                height: 100%;
            }

            #devices ul,
            #messages ul {
                margin: 0;
                padding: 0;
                list-style: none;
            }

            /* ================================================== */

            #about-page ha-card {
                max-width: 600px;
                margin: 0 auto 16px auto;
            }
            #about-page ha-card:last-child {
                margin-bottom: 0;
            }
            #about-logo .card-content {
                padding: 0;
            }
            #about-icon {
                --mdc-icon-size: 80px;
                color: var(--Cyan);
                text-align: center;
                margin-top: 32px;
            }
            #about-name {
                color: var(--primary-text-color);
                font-size: var(--ha-font-size-xl);
                font-weight: var(--ha-font-weight-normal);
                line-height: var(--ha-line-height-condensed);
                text-align: center;
                margin: 24px;
            }
            #about-name small {
                opacity: 0.8;
            }
            #about-name aside {
                display: block;
                margin-top: 8px;
                font-size: var(--ha-font-size-m);
                opacity: 0.8;
            }
            #about-links {
                background-color: transparent;
                border-top: 1px solid var(--divider-color);
            }
            #about-links ha-icon[slot='end'] {
                --mdc-icon-size: 20px;
            }
            .icon-background {
                --mdc-icon-size: 24px;
                border-radius: 50%;
                padding: 8px;
            }
            .icon-background ha-icon {
                color: #fff;
            }
            #how-it-works {
                margin-bottom: 15px;
            }
            #about-page ul {
                padding: 0 1.5em;
            }
            #about-page [header='Usage'] ul {
                list-style-type: '👉';
            }
            #about-page [header='Usage'] ul li {
                margin-bottom: 4px;
                padding-left: 0.5em;
            }

            @media (max-width: 600px) {
                #log-page {
                    flex-direction: column;
                }

                #devices {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    transform: translateX(-100%);
                    z-index: 1000;
                }

                #log-page[data-sidebar-open] #devices {
                    transform: translateX(0);
                }

                #messages {
                    flex: 1;
                    width: 100%;
                }

                #log-page[data-sidebar-open] #messages {
                    opacity: 0.5;
                }

                section {
                    padding: 0;
                }
                ha-card {
                    border-width: 1px 0px;
                    border-radius: var(--ha-border-radius-square);
                    box-shadow: unset;
                }
            }
        `}};if(!customElements.get("zigbee-log-panel")){customElements.define("zigbee-log-panel",b);class r extends b{}customElements.define("zigbee-log-panel-1",r);class e extends b{}customElements.define("zigbee-log-panel-2",e);class t extends b{}customElements.define("zigbee-log-panel-3",t)}
