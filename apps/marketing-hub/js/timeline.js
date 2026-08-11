// Campaigns & Timeline tab.
// Visual Gantt of campaigns/events from the shared data model (data.events).
// Each item links to its budget lines (data.activities with matching eventId),
// its partners, sponsorships, and content. Add/edit campaigns here; money is
// added as linked budget lines on the Budget tab.
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;

  const PALETTE = ["#ff7900", "#4bb4e6", "#50be87", "#a885d8", "#ffb000",
                   "#ff5e8a", "#00c1b2", "#9ad14b", "#e8762b", "#7d8fff"];
  const LABELW = 230, PXDAY = 3.6, ROWH = 30;

  const view = { groupBy: "cluster", colorBy: "kind", kind: "all", scope: { m1: "", cluster: "", entityId: "" }, q: "", year: "", quarters: [], month: "", country: "" };

  function ensureStyles() {
    if (document.getElementById("tl-styles")) return;
    const css = `
    #tab-timeline .tl-toolbar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-bottom:12px}
    #tab-timeline .tl-toolbar .grow{flex:1;min-width:160px}
    #tab-timeline .tl-legend{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:4px 0 10px;font-size:12px;color:#555}
    #tab-timeline .tl-legend .k{display:flex;align-items:center;gap:6px}
    #tab-timeline .tl-swatch{width:13px;height:13px;border-radius:3px;display:inline-block}
    #tab-timeline .tl-scroll{overflow:auto;border:1px solid #e3e6ea;border-radius:10px;background:#fff;max-height:62vh;position:relative}
    #tab-timeline .tl-chart{position:relative}
    #tab-timeline .tl-months{position:sticky;top:0;z-index:6;display:flex;background:#f6f7f9;border-bottom:1px solid #e3e6ea;height:30px}
    #tab-timeline .tl-lblspace{position:sticky;left:0;z-index:7;background:#f6f7f9;border-right:1px solid #e3e6ea}
    #tab-timeline .tl-month{border-right:1px solid #eef0f3;font-size:11px;color:#777;display:flex;align-items:center;padding-left:6px;flex:0 0 auto}
    #tab-timeline .tl-month.q{background:#fbfcfd}
    #tab-timeline .tl-month.jan{border-left:2px solid #d7dbe0}
    #tab-timeline .tl-grouphdr{position:sticky;left:0;z-index:5;display:flex;align-items:center;gap:8px;background:#eef1f4;border-bottom:1px solid #e3e6ea;border-top:1px solid #e3e6ea;padding:6px 12px;cursor:pointer;font-weight:600;font-size:12px;color:#333}
    #tab-timeline .tl-grouphdr .gcount{color:#888;font-weight:400}
    #tab-timeline .tl-row{position:relative;height:${ROWH}px;border-bottom:1px solid #f1f3f5}
    #tab-timeline .tl-row:hover{background:#fafbfc}
    #tab-timeline .tl-rowlabel{position:sticky;left:0;z-index:4;height:100%;display:flex;align-items:center;padding:0 10px;background:#fff;border-right:1px solid #e3e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:#222}
    #tab-timeline .tl-row:hover .tl-rowlabel{background:#fafbfc}
    #tab-timeline .tl-track{position:absolute;top:0;height:100%}
    #tab-timeline .tl-bar{position:absolute;top:6px;height:18px;border-radius:5px;cursor:pointer;display:flex;align-items:center;padding:0 7px;font-size:11px;color:#11130f;overflow:hidden;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,.18)}
    #tab-timeline .tl-bar:hover{filter:brightness(1.08);outline:2px solid #333}
    #tab-timeline .tl-eur{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;min-width:14px;border-radius:50%;background:#3b6d11;color:#fff;font-weight:700;font-size:10px;margin-right:5px}
    #tab-timeline .tl-bar.open-left{border-top-left-radius:0;border-bottom-left-radius:0;border-left:3px dashed rgba(0,0,0,.55)}
    #tab-timeline .tl-bar.open-right{border-top-right-radius:0;border-bottom-right-radius:0;border-right:3px dashed rgba(0,0,0,.55)}
    #tab-timeline .tl-barlabel{position:absolute;top:6px;display:flex;align-items:center;font-size:11px;color:#333;white-space:nowrap;cursor:pointer}
    #tab-timeline .tl-barlabel:hover{text-decoration:underline}
    #tab-timeline .tl-diamond{position:absolute;top:7px;width:16px;height:16px;transform:rotate(45deg);border-radius:3px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.2)}
    #tab-timeline .tl-diamond:hover{filter:brightness(1.1);outline:2px solid #333}
    #tab-timeline .tl-diflabel{position:absolute;top:6px;display:flex;align-items:center;font-size:11px;color:#333;white-space:nowrap;pointer-events:none}
    #tab-timeline .tl-today{position:absolute;top:30px;bottom:0;width:2px;background:#ff4d6d;z-index:3;pointer-events:none}
    #tab-timeline .tl-todayflag{position:absolute;top:30px;transform:translateX(-50%);background:#ff4d6d;color:#fff;font-size:10px;padding:1px 6px;border-radius:0 0 6px 6px;z-index:6}
    #tab-timeline .tl-empty{padding:36px;text-align:center;color:#888}
    #tab-timeline .tl-sub{display:flex;gap:8px;align-items:center;margin:2px 0 14px;color:#666;font-size:12px}
    .tl-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin-bottom:8px}
    .tl-detail-grid .lab{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
    .tl-chips{display:flex;flex-wrap:wrap;gap:5px}
    .tl-chip{background:#eef1f4;border-radius:20px;padding:2px 9px;font-size:11px;color:#444}
    .tl-rollup{display:flex;gap:18px;flex-wrap:wrap;background:#f6f7f9;border:1px solid #e3e6ea;border-radius:8px;padding:10px 14px;margin:8px 0}
    .tl-rollup .n{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.03em}
    .tl-rollup .v{font-size:16px;font-weight:650}
    .tl-mini{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
    .tl-mini th,.tl-mini td{text-align:left;padding:5px 8px;border-bottom:1px solid #eef0f3}
    .tl-mini td.num,.tl-mini th.num{text-align:right}
    .tl-rowset{display:flex;flex-direction:column;gap:6px}
    .tl-rowset .line{display:grid;grid-template-columns:1fr 1fr 130px 30px;gap:8px;align-items:center}
    .tl-rowset .line.content{grid-template-columns:1fr 2fr 30px}
    .tl-iconbtn{background:none;border:1px solid #d7dbe0;border-radius:6px;cursor:pointer;color:#a00;font-size:14px;line-height:1;padding:4px 8px}
    `;
    const s = document.createElement("style");
    s.id = "tl-styles"; s.textContent = css;
    document.head.appendChild(s);
  }

  // ---- date helpers ----
  function parseISO(s){ if(!s) return null; const [a,b,c]=s.split("-").map(Number); return new Date(a,b-1,c); }
  function dayDiff(a,b){ return Math.round((b-a)/86400000); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function yearBounds(events){
    let minY=2026,maxY=2026;
    const ys=events.map(e=>parseISO(e.start)).filter(Boolean).map(d=>d.getFullYear());
    const ye=events.map(e=>parseISO(e.end||e.start)).filter(Boolean).map(d=>d.getFullYear());
    const all=ys.concat(ye);
    if(all.length){ minY=Math.min(...all); maxY=Math.max(...all); }
    return { start:new Date(minY,0,1), end:new Date(maxY,11,31) };
  }
  function uniq(arr){ return [...new Set(arr.filter(x=>x!==undefined&&x!==null&&x!==""))].sort(); }

  // The cluster a timeline item belongs to comes from its organising entity (authoritative),
  // falling back to its stored cluster only when it has no entity. This keeps the overview
  // grouping in step with the cluster filter, which matches on the entity's cluster.
  function clusterOf(e){
    const ent = e.entityId ? S.entityById(e.entityId) : null;
    return (ent && (ent.group||"").trim()) || (e.cluster||"").trim() || "Unspecified";
  }
  // Scope match for events, using the same entity-derived cluster as the grouping above.
  function matchesScope(e){
    const sc = view.scope || {};
    if(!sc.m1 && !sc.cluster && !sc.entityId) return true;
    const ent = e.entityId ? S.entityById(e.entityId) : null;
    if(sc.entityId) return !!ent && S.canonicalEntityId(e.entityId) === S.canonicalEntityId(sc.entityId);
    if(sc.cluster){
      if(clusterOf(e) !== sc.cluster) return false;
      if(sc.m1 && ent && (ent.m1||"") !== sc.m1) return false;
      return true;
    }
    if(sc.m1) return !!ent && (ent.m1||"") === sc.m1;
    return true;
  }

  function dimValue(e,dim){
    if(dim==="kind") return e.kind||"Event";
    if(dim==="none") return "All items";
    if(dim==="entity") return S.eventEntityName(e)||"Unspecified";
    if(dim==="owner") return S.eventOwnerName(e)||"Unspecified";
    if(dim==="type"){ const t=e.activityTypeId?S.actTypeById(e.activityTypeId):null; return t?t.name:"Unspecified"; }
    if(dim==="cluster") return clusterOf(e);
    if(dim==="campaign") return campaignNameOf(e);
    return e[dim]||"Unspecified";
  }
  // The campaign an item belongs to: a campaign is itself; an event uses its linked campaign.
  function campaignNameOf(e){
    if((e.kind||"Event")==="Campaign") return e.name||"(unnamed campaign)";
    const c=e.campaignId?S.eventById(e.campaignId):null;
    return c?(c.name||"(unnamed campaign)"):"No campaign";
  }
  function catList(events,dim){ return uniq(events.map(e=>dimValue(e,dim))); }
  function colorFor(events,e){
    const cats=catList(events,view.colorBy);
    const idx=cats.indexOf(dimValue(e,view.colorBy));
    return PALETTE[(idx<0?0:idx)%PALETTE.length];
  }

  function linkedActivities(eventId){
    return (S.state.data.activities||[]).filter(a=>(a.eventIds||[]).includes(eventId));
  }
  // Even-split allocation: a line shared across N campaigns counts 1/N toward each.
  function lineShare(a){ const n=(a.eventIds||[]).length; return n>0?1/n:1; }
  function eventBudget(eventId){
    const lines=linkedActivities(eventId);
    const sum=k=>lines.reduce((s,a)=>s+((a[k]||0)*lineShare(a)),0);
    const fG=sum("forecastGross"),fP=sum("forecastPartner"),aG=sum("actualGross"),aP=sum("actualPartner");
    return { count:lines.length, fG,fP,fNet:fG-fP, aG,aP,aNet:aG-aP, lines };
  }
  function defaultStatusId(){
    const list=(S.state.data.settings.statuses||[]);
    const p=list.find(s=>(s.name||"").toLowerCase()==="planned");
    return p?p.id:(list[0]&&list[0].id)||"";
  }
  // Compact outcomes block for the campaign detail modal.
  function outcomesSummary(e){
    const oc=e.outcomes||{};
    const cells=S.OUTCOME_METRICS.filter(m=>oc[m.key]).map(m=>{
      const o=oc[m.key]||{};
      const subT=m.kind==="pa"?"p":"t";
      const tgt=+o[subT]||0, act=+o.a||0;
      const fmt=m.money?S.fmtMoney:S.fmtNum;
      const tgtLbl=m.kind==="pa"?"potential":"target";
      return `<div><div class="n">${m.label}</div><div class="v">${fmt(act)}</div><div class="muted small">${fmt(tgt)} ${tgtLbl}</div></div>`;
    });
    if(!cells.length) return "";
    return `<h3 style="margin:12px 0 2px">Outcomes</h3><div class="tl-rollup">${cells.join("")}</div>`;
  }

  // ---------- render ----------
  function render(){
    ensureStyles();
    const root=document.getElementById("tab-timeline");
    const data=S.state.data;
    if(!data){ root.innerHTML=""; return; }
    // On first view for a user, default the country filter to their home country (if set).
    if(view._forUser !== S.state.currentUserId){
      view._forUser = S.state.currentUserId;
      const u = S.state.currentUserId ? S.userById(S.state.currentUserId) : null;
      view.country = (u && u.homeCountryId) || "";
    }
    const events=data.events||[];

    root.innerHTML=`
      <div class="tl-toolbar filter-bar">
        <div><label>Group</label>
          <select id="tl-group">
            ${opt([["cluster","Cluster"],["campaign","Campaign"],["entity","Organising entity"],["type","Event type"],["kind","Event / Campaign"],["owner","Owner"],["none","None"]],view.groupBy)}
          </select></div>
        <div><label>Color</label>
          <select id="tl-color">
            ${opt([["kind","Event / Campaign"],["campaign","Campaign"],["cluster","Cluster"],["entity","Organising entity"],["type","Event type"]],view.colorBy)}
          </select></div>
        <div><label>Kind</label>
          <select id="tl-kind">${opt([["all","All"],["Event","Events"],["Campaign","Campaigns"]],view.kind)}</select></div>
        <div><label>Year</label>
          <select id="tl-year"><option value="">All</option>${tlYears(events).map(y=>`<option ${String(view.year)===String(y)?"selected":""} value="${y}">${y}</option>`).join("")}</select></div>
        <div><label>Quarters</label>${S.quarterChecks("tlq", view.quarters)}</div>
        <div><label>Month</label><select id="tl-month">${S.monthOptions(view.month)}</select></div>
        ${S.scopeFilterHtml("tl", view.scope)}
        ${(data.settings.countries||[]).length ? `<div><label>Country</label>
          <select id="tl-country">
            <option value="">All countries</option>
            ${(data.settings.countries||[]).slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"",undefined,{sensitivity:"base"})).map(c=>`<option ${view.country===c.id?"selected":""} value="${c.id}">${S.escapeHtml(c.name)}</option>`).join("")}
            <option value="__untagged" ${view.country==="__untagged"?"selected":""}>(untagged)</option>
          </select></div>` : ""}
        <div class="grow"><label>Search</label>
          <input id="tl-search" type="text" value="${S.escapeHtml(view.q)}" placeholder="Name, owner, domain, type" /></div>
        <div><label>&nbsp;</label><div><button id="tl-ppt" class="secondary" title="Download the current filtered view as a roadmap slide (PowerPoint)">Download agenda</button></div></div>
        <div><label>&nbsp;</label><div><button id="tl-check" class="secondary" style="display:none" title="Check for updates">Check for updates</button></div></div>
        <div><label>&nbsp;</label><div><button id="tl-publish" class="primary" style="display:none; background:#0a7d33;" title="Publish changes">Publish changes</button></div></div>
        <div><label>&nbsp;</label><div><button id="tl-add" class="primary">New</button></div></div>
      </div>
      <div class="tl-sub">
        <span>${events.length} campaigns &amp; events</span>
      </div>
      <div class="tl-legend" id="tl-legend"></div>
      <div class="tl-scroll"><div class="tl-chart" id="tl-chart">
        <div class="tl-today" id="tl-today"></div><div class="tl-todayflag" id="tl-todayflag">Today</div>
        <div class="tl-months" id="tl-months"></div>
        <div id="tl-rows"></div>
      </div></div>
    `;

    root.querySelector("#tl-group").onchange=e=>{view.groupBy=e.target.value;render();};
    root.querySelector("#tl-color").onchange=e=>{view.colorBy=e.target.value;render();};
    root.querySelector("#tl-kind").onchange=e=>{view.kind=e.target.value;render();};
    root.querySelector("#tl-year").onchange=e=>{view.year=e.target.value;render();};
    root.querySelectorAll(".tlq-q").forEach(cb=>{ cb.onchange=()=>{ view.quarters=[...root.querySelectorAll(".tlq-q:checked")].map(x=>x.value); render(); }; });
    root.querySelector("#tl-month").onchange=e=>{view.month=e.target.value;render();};
    const tlCountry=root.querySelector("#tl-country");
    if(tlCountry) tlCountry.onchange=e=>{view.country=e.target.value;render();};
    S.wireScopeFilter(root,"tl",view.scope,render);
    root.querySelector("#tl-search").oninput=e=>{view.q=e.target.value;drawRows();};
    const canEdit=!window.MB_AUTH||window.MB_AUTH.can("editCampaign");
    const addBtn=root.querySelector("#tl-add");
    if(canEdit) addBtn.onclick=()=>openCampaignModal(null);
    else addBtn.style.display="none";
    if(window.MB_DATA && window.MB_DATA.wirePublishButton) window.MB_DATA.wirePublishButton(root.querySelector("#tl-publish"));
    if(window.MB_DATA && window.MB_DATA.wireCheckButton) window.MB_DATA.wireCheckButton(root.querySelector("#tl-check"));
    const pptBtn=root.querySelector("#tl-ppt");
    if(pptBtn) pptBtn.onclick=()=>{
      if(!window.MB_PPT) return S.toast("Export not available.","error");
      const model=buildRoadmapModel();
      if(!model.lanes.length) return S.toast("No campaigns or events in the current view.","error");
      window.MB_PPT.exportRoadmap(model);
    };

    buildMonths(events);
    drawRows();
  }

  function opt(pairs,sel){ return pairs.map(([v,l])=>`<option ${sel===v?"selected":""} value="${v}">${l}</option>`).join(""); }

  // The zoom window from the Year/Quarter/Month filters, or null (whole timeline).
  // Bounding window for drawing the timeline (min start to max end of the selection).
  function periodWindow(){
    const y=view.year?+view.year:null;
    const qs=(view.quarters||[]).map(Number).filter(Boolean);
    const mo=view.month!==""?+view.month:null;
    if(!y && !qs.length && mo===null) return null;
    const year=y||new Date().getFullYear();
    let sM=0,eM=11;
    if(mo!==null){ sM=mo; eM=mo; }
    else if(qs.length){ sM=Math.min(...qs.map(q=>(q-1)*3)); eM=Math.max(...qs.map(q=>(q-1)*3+2)); }
    return { start:new Date(year,sM,1), end:new Date(year,eM+1,0) };
  }
  // Exact allowed date ranges for filtering: each selected quarter (or month, or whole year).
  function periodRanges(){
    const y=view.year?+view.year:null;
    const qs=(view.quarters||[]).map(Number).filter(Boolean);
    const mo=view.month!==""?+view.month:null;
    if(!y && !qs.length && mo===null) return null; // no period filter
    const year=y||new Date().getFullYear();
    if(mo!==null) return [{start:new Date(year,mo,1), end:new Date(year,mo+1,0)}];
    if(qs.length) return qs.map(q=>({start:new Date(year,(q-1)*3,1), end:new Date(year,(q-1)*3+3,0)}));
    return [{start:new Date(year,0,1), end:new Date(year,11,31)}];
  }
  function geom(events){
    const yb=periodWindow()||yearBounds(events);
    const totalDays=dayDiff(yb.start,yb.end)+1;
    return { yb, totalDays, trackW:Math.round(totalDays*PXDAY) };
  }
  function xOf(date,g){ return clamp(dayDiff(g.yb.start,date),0,g.totalDays)*PXDAY; }

  function buildMonths(events){
    const g=geom(events);
    const m=document.getElementById("tl-months");
    document.getElementById("tl-chart").style.width=(LABELW+g.trackW)+"px";
    m.style.width=(LABELW+g.trackW)+"px";
    let html=`<div class="tl-lblspace" style="flex:0 0 ${LABELW}px"></div>`;
    let d=new Date(g.yb.start);
    while(d<=g.yb.end){
      const next=new Date(d.getFullYear(),d.getMonth()+1,1);
      const w=dayDiff(d,next)*PXDAY;
      const q=Math.floor(d.getMonth()/3)%2===1;
      const jan=d.getMonth()===0;
      const lbl=jan?`${d.toLocaleDateString("en-GB",{month:"short"})} ${d.getFullYear()}`:d.toLocaleDateString("en-GB",{month:"short"});
      html+=`<div class="tl-month ${q?"q":""} ${jan?"jan":""}" style="flex:0 0 ${w}px">${lbl}</div>`;
      d=next;
    }
    m.innerHTML=html;
    const now=new Date();
    const t=document.getElementById("tl-today"), tf=document.getElementById("tl-todayflag");
    if(now>=g.yb.start&&now<=g.yb.end){ const tx=LABELW+xOf(now,g); t.style.left=tx+"px"; tf.style.left=tx+"px"; t.style.display=""; tf.style.display=""; }
    else { t.style.display="none"; tf.style.display="none"; }
  }

  function buildLegend(events){
    const leg=document.getElementById("tl-legend");
    if(!leg) return;
    const cats=catList(events,view.colorBy);
    const colorLabel={kind:"Event / Campaign",campaign:"Campaign",cluster:"Cluster",entity:"Organising entity",type:"Event type"}[view.colorBy];
    leg.innerHTML=`<span>Color by ${colorLabel}:</span>`+
      cats.map((c,i)=>`<span class="k"><span class="tl-swatch" style="background:${PALETTE[i%PALETTE.length]}"></span>${S.escapeHtml(c)}</span>`).join("")+
      `<span class="k" style="margin-left:auto"><span class="tl-swatch" style="transform:rotate(45deg);background:#999"></span>single-day</span>`+
      `<span class="k"><span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#3b6d11;color:#fff;font-weight:700;font-size:10px">€</span> has budget</span>`+
      (periodWindow()?`<span class="k"><span style="display:inline-block;width:13px;height:13px;border-left:3px dashed #555"></span> spans beyond period</span>`:"");
  }

  function tlYears(events){
    const ys=new Set();
    (events||[]).forEach(e=>{ const d=parseISO(e.start); if(d) ys.add(d.getFullYear()); });
    return Array.from(ys).sort();
  }
  // Country filter: a specific country shows events tagged with it, plus any event tagged with a
  // "global" country (like Pan-European). Untagged events show only under "All countries".
  function matchesCountry(e){
    if(!view.country) return true;
    const ids=e.countryIds||[];
    if(view.country==="__untagged") return ids.length===0;
    if(ids.includes(view.country)) return true;
    const globalIds=new Set((S.state.data.settings.countries||[]).filter(c=>c.global).map(c=>c.id));
    return ids.some(id=>globalIds.has(id));
  }
  // Build the roadmap model (lanes + dated items) from the current filtered, grouped view.
  function buildRoadmapModel(){
    const data=S.state.data;
    const events=filtered(data.events||[]);
    let year=view.year?+view.year:0;
    if(!year){
      const ys=events.map(e=>{const d=parseISO(e.start);return d?d.getFullYear():null;}).filter(Boolean).sort();
      year=ys.length?ys[0]:new Date().getFullYear();
    }
    const inYear=events.filter(e=>{ const s=parseISO(e.start), en=parseISO(e.end||e.start); return s&&en&&s.getFullYear()<=year&&en.getFullYear()>=year; });
    const map={};
    inYear.forEach(e=>{ const k=dimValue(e,view.groupBy); (map[k]=map[k]||[]).push(e); });
    const lanes=Object.keys(map).sort().map(k=>({
      label:k,
      items: map[k].map(e=>{
        // Only non-financial, structured fields go on the slide. Free-text notes are deliberately
        // left out so no budget figure typed into a note can ever appear. No amounts anywhere.
        const typeName=e.activityTypeId?((S.actTypeById(e.activityTypeId)||{}).name||""):"";
        const ownerName=S.eventOwnerName(e)||"";
        const lines=[typeName, ownerName].filter(Boolean);
        return { name:e.name, lines, start:e.start, end:e.end||e.start, kind:e.kind||"Event" };
      })
    }));
    let scope="";
    if(view.country && view.country!=="__untagged"){ const c=S.countryById(view.country); if(c) scope=c.name; }
    else if(view.scope && view.scope.cluster) scope=view.scope.cluster;
    else if(view.scope && view.scope.entityId){ const en=S.entityById(view.scope.entityId); if(en) scope=en.name; }
    const title="Campaign roadmap"+(scope?" - "+scope:"")+" ("+year+")";
    return { title, year, lanes };
  }
  function filtered(events){
    const q=view.q.trim().toLowerCase();
    const ranges=periodRanges();
    return events.filter(e=>{
      if(view.kind!=="all"&&(e.kind||"Event")!==view.kind) return false;
      if(!matchesScope(e)) return false;
      if(!matchesCountry(e)) return false;
      if(ranges){
        // Show anything ACTIVE in any selected quarter/month: it may start before or end after it.
        const es=parseISO(e.start), ee=parseISO(e.end||e.start);
        if(!(es && ee && ranges.some(r=>es<=r.end && ee>=r.start))) return false;
      }
      if(q){
        const tname=e.activityTypeId?((S.actTypeById(e.activityTypeId)||{}).name||""):"";
        const hay=[e.name,S.eventOwnerName(e),tname,S.eventEntityName(e),clusterOf(e),(e.domains||[]).join(" ")].filter(Boolean).join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function drawRows(){
    const data=S.state.data, events=data.events||[];
    buildLegend(events);
    const g=geom(events);
    const rowsEl=document.getElementById("tl-rows");
    if(!rowsEl) return;
    const list=filtered(events);
    rowsEl.innerHTML="";
    if(!list.length){ rowsEl.innerHTML=`<div class="tl-empty">No campaigns match. ${events.length===0?'Click "+ New campaign" to add one.':''}</div>`; return; }

    let groups;
    if(view.groupBy==="none") groups=[["All items",list]];
    else {
      const map={};
      list.forEach(e=>{ const k=dimValue(e,view.groupBy); (map[k]=map[k]||[]).push(e); });
      groups=Object.keys(map).sort().map(k=>[k,map[k]]);
    }

    groups.forEach(([gname,gitems])=>{
      const gh=document.createElement("div");
      gh.className="tl-grouphdr"; gh.style.width=(LABELW+g.trackW)+"px";
      gh.innerHTML=`${S.escapeHtml(gname)} <span class="gcount">${gitems.length}</span>`;
      rowsEl.appendChild(gh);
      gitems.sort((a,b)=>(a.start||"").localeCompare(b.start||""));
      gitems.forEach(e=>rowsEl.appendChild(rowEl(e,g,events)));
    });
  }

  // Rich hover text shown on the timeline (name + key details).
  function tooltipFor(e){
    const at=e.activityTypeId?((S.actTypeById(e.activityTypeId)||{}).name||""):"";
    const svp=e.svpId?((S.svpById(e.svpId)||{}).name||""):"";
    const dates=(e.end&&e.end!==e.start)?`${S.fmtDate(e.start)} - ${S.fmtDate(e.end)}`:`${S.fmtDate(e.start)} (single day)`;
    return [
      e.name,
      `Kind: ${e.kind||"Event"}`,
      `Dates: ${dates}`,
      `Activity type: ${at||"-"}`,
      `Cluster: ${clusterOf(e)}`,
      `Entity: ${S.eventEntityName(e)||"-"}`,
      `Owner: ${S.eventOwnerName(e)||"-"}`,
      `SVP: ${svp||"-"}`,
      ((e.kind||"Event")==="Event"?`Campaign: ${campaignNameOf(e)}`:null),
      `Countries: ${S.countryNamesOf(e.countryIds).join(", ")||"-"}`,
    ].filter(Boolean).join("\n");
  }

  // The bar/diamond shows the event name. The left row label shows the next level down from the
  // current grouping (see subLabelFor), so the name is not repeated on both sides.
  function markerText(e){ return e.name||""; }
  function subLabelFor(e){
    if(view.groupBy==="entity") return S.eventOwnerName(e)||"";
    if(view.groupBy==="m1") return clusterOf(e);
    if(view.groupBy==="owner") return S.eventEntityName(e)||"";
    if(view.groupBy==="none") return clusterOf(e);
    // cluster, type, kind -> show the entity as the deeper structural level
    return S.eventEntityName(e)||"";
  }

  // Shared "has budget" marker: a small green euro badge used on bars and diamonds alike.
  function makeEur(){ const b=document.createElement("span"); b.className="tl-eur"; b.textContent="€"; b.title="Has an allocated budget"; return b; }

  function rowEl(e,g,events){
    const tip=tooltipFor(e);
    const row=document.createElement("div");
    row.className="tl-row"; row.style.width=(LABELW+g.trackW)+"px";
    const label=document.createElement("div");
    label.className="tl-rowlabel"; label.style.width=LABELW+"px";
    label.textContent=subLabelFor(e); label.title=tip;
    row.appendChild(label);

    const track=document.createElement("div");
    track.className="tl-track"; track.style.left=LABELW+"px"; track.style.width=g.trackW+"px";
    const col=colorFor(events,e);
    const s=parseISO(e.start), end=parseISO(e.end||e.start);
    const hasBudget=eventBudget(e.id).count>0;
    const single=!e.end||e.start===e.end;
    if(single){
      const dm=document.createElement("div");
      dm.className="tl-diamond"; dm.style.left=(xOf(s,g)-8)+"px"; dm.style.background=col; dm.title=tip;
      const lbl=document.createElement("div");
      lbl.className="tl-diflabel"; lbl.style.left=(xOf(s,g)+12)+"px"; lbl.title=tip;
      if(hasBudget) lbl.appendChild(makeEur());
      lbl.appendChild(document.createTextNode(markerText(e)));
      dm.onclick=()=>openCampaignDetail(e.id);
      track.appendChild(dm); track.appendChild(lbl);
    } else {
      const bar=document.createElement("div");
      const openLeft = s < g.yb.start;   // starts before the visible window
      const openRight = end > g.yb.end;  // ends after the visible window
      bar.className="tl-bar"+(openLeft?" open-left":"")+(openRight?" open-right":"");
      const left=xOf(s,g), w=Math.max(16,xOf(end,g)-left+PXDAY);
      bar.style.left=left+"px"; bar.style.width=w+"px"; bar.style.background=col;
      bar.title=tip + (openLeft||openRight ? "\n(spans beyond the selected period)" : "");
      bar.onclick=()=>openCampaignDetail(e.id);
      track.appendChild(bar);
      // Name (and the budget badge) go inside the bar only if they fit; otherwise outside, to the right.
      const mtxt = markerText(e);
      const fits = (mtxt.length * 6.6 + 14 + (hasBudget ? 19 : 0)) <= w;
      if (fits) {
        if(hasBudget) bar.appendChild(makeEur());
        bar.appendChild(document.createTextNode(mtxt));
      } else {
        const lbl=document.createElement("div");
        lbl.className="tl-barlabel";
        lbl.style.left=(left+w+6)+"px";
        lbl.title=tip;
        if(hasBudget) lbl.appendChild(makeEur());
        lbl.appendChild(document.createTextNode(mtxt));
        lbl.onclick=()=>openCampaignDetail(e.id);
        track.appendChild(lbl);
      }
    }
    row.appendChild(track);
    return row;
  }

  // ---------- campaign detail ----------
  function openCampaignDetail(id){
    const data=S.state.data;
    const e=data.events.find(x=>x.id===id);
    if(!e) return;
    const b=eventBudget(id);
    const dates=e.end&&e.end!==e.start
      ? `${S.fmtDate(e.start)} &rarr; ${S.fmtDate(e.end)}`
      : `${S.fmtDate(e.start)} (single day)`;

    const partners=(e.partners||[]);
    const content=(e.content||[]);
    const coFund=partners.reduce((s,p)=>s+(+p.coFunding||0),0);

    const typeName=e.activityTypeId?((S.actTypeById(e.activityTypeId)||{}).name||"-"):"-";
    const modal=S.openModal(`
      <h2 style="margin-bottom:2px">${S.escapeHtml(e.name)}</h2>
      <div class="muted" style="margin-bottom:10px">${S.escapeHtml(e.kind||"Event")} &middot; ${S.escapeHtml(typeName)} &middot; ${dates}</div>

      <div class="tl-detail-grid">
        <div><div class="lab">Organising entity</div>${S.escapeHtml(S.eventEntityName(e)||"-")}</div>
        <div><div class="lab">Cluster</div>${S.escapeHtml(clusterOf(e))}</div>
        <div><div class="lab">Owner</div>${S.escapeHtml(S.eventOwnerName(e)||"-")}</div>
        <div><div class="lab">Campaign code</div>${S.escapeHtml(e.campaignCode||"-")}</div>
        <div><div class="lab">Countries</div>${S.escapeHtml(S.countryNamesOf(e.countryIds).join(", ")||"-")}</div>
      </div>
      ${(e.domains&&e.domains.length)?`<div style="margin:6px 0"><div class="lab" style="color:#888;font-size:11px;text-transform:uppercase">Domains</div><div class="tl-chips">${e.domains.map(d=>`<span class="tl-chip">${S.escapeHtml(d)}</span>`).join("")}</div></div>`:""}
      ${e.info?`<div style="margin:6px 0;color:#555">${S.escapeHtml(e.info)}</div>`:""}

      <div class="tl-rollup">
        <div><div class="n">Budget lines</div><div class="v">${b.count}</div></div>
        <div><div class="n">Forecast net</div><div class="v">${S.fmtMoney(b.fNet)}</div></div>
        <div><div class="n">Actual net</div><div class="v">${S.fmtMoney(b.aNet)}</div></div>
        <div><div class="n">Partner co-funding</div><div class="v">${S.fmtMoney(coFund)}</div></div>
      </div>

      ${outcomesSummary(e)}

      <h3 style="margin:12px 0 2px">Partners (${partners.length})</h3>
      ${partners.length?`<div class="tl-chips">${partners.map(p=>`<span class="tl-chip">${S.escapeHtml(p.name)}${p.role?" · "+S.escapeHtml(p.role):""}${p.coFunding?" · "+S.fmtMoney(+p.coFunding):""}</span>`).join("")}</div>`:`<div class="muted">No partners yet.</div>`}

      <h3 style="margin:12px 0 2px">Content &amp; assets (${content.length})</h3>
      ${content.length?`<ul style="margin:4px 0 0;padding-left:18px">${content.map(c=>`<li>${c.url?`<a href="${S.escapeHtml(c.url)}" target="_blank" rel="noopener">${S.escapeHtml(c.label||c.url)} &#8599;</a>`:S.escapeHtml(c.label||"")}</li>`).join("")}</ul>`:`<div class="muted">No content linked yet.</div>`}

      <h3 style="margin:14px 0 2px">Linked budget lines</h3>
      ${b.count?`<table class="tl-mini"><thead><tr><th>Date</th><th>Name</th><th>Cluster</th><th>Entity</th><th>Type</th><th>Status</th><th class="num">Forecast net</th><th class="num">Actual net</th></tr></thead><tbody>
        ${b.lines.slice().sort((x,y)=>(x.date||"").localeCompare(y.date||"")).map(a=>{
          const t=S.actTypeById(a.activityTypeId), st=S.statusById(a.statusId), ent=a.entityId?S.entityById(a.entityId):null;
          return `<tr><td>${a.date?S.fmtDate(a.date):"-"}</td><td>${S.escapeHtml(a.name||"")}</td><td>${ent?S.escapeHtml(ent.group||"-"):"-"}</td><td>${ent?S.escapeHtml(ent.name):"-"}</td><td>${t?S.escapeHtml(t.name):"-"}</td><td>${st?S.escapeHtml(st.name):"-"}</td><td class="num">${S.fmtMoney((a.forecastGross||0)-(a.forecastPartner||0))}</td><td class="num">${S.fmtMoney((a.actualGross||0)-(a.actualPartner||0))}</td></tr>`;
        }).join("")}
      </tbody></table>`:`<div class="muted">No budget lines linked. Add sponsorships, content production, or other costs as budget lines tied to this campaign.</div>`}

      <div class="actions" style="margin-top:16px">
        <button class="secondary" id="d-close">Close</button>
        ${(!window.MB_AUTH||window.MB_AUTH.can("editCampaign"))?'<button class="secondary" id="d-edit">Edit campaign</button>':''}
        ${(!window.MB_AUTH||window.MB_AUTH.can("editCampaign"))?'<button class="primary" id="d-addline">+ Add budget line</button>':''}
      </div>
    `);
    modal.querySelector("#d-close").onclick=S.closeModal;
    const dEdit=modal.querySelector("#d-edit");
    if(dEdit) dEdit.onclick=()=>openCampaignModal(id);
    const dAdd=modal.querySelector("#d-addline");
    if(dAdd) dAdd.onclick=()=>{
      S.closeModal();
      window.MB_APP.switchTab("budget");
      // Inherit the campaign's entity and SVP so a new line matches its campaign by default (still editable).
      window.MB_BUDGET.newActivity({
        eventIds:[id], name:e.name, date:e.start, activityTypeId:e.activityTypeId||"",
        entityId:e.entityId||"", svpId:e.svpId||"",
      });
    };
  }

  function tlFmtDT(iso){ if(!iso) return "-"; const d=new Date(iso); if(isNaN(d)) return "-"; return d.toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }

  // ---------- add / edit campaign ----------
  function openCampaignModal(id){
    const data=S.state.data;
    const isEdit=!!id;
    const e=isEdit ? data.events.find(x=>x.id===id) : {
      id:API.uid(), name:"", kind:"Event", activityTypeId:"",
      start:new Date().toISOString().slice(0,10), end:"",
      entityId:"", cluster:"", ownerId:"", campaignCode:"", svpId:"", campaignId:"",
      domains:[], scope:[], info:"",
      partners:[], content:[], outcomes:{},
      createdBy:S.state.currentUserId, createdAt:new Date().toISOString(),
    };
    const partnerNames=(data.settings.partners||[]).map(p=>p.name);

    // Budget link: the campaign manages one "primary" budget line. Prefill from it if present.
    const uniqueEnts=S.uniqueEntities();
    const managed=(isEdit && e.primaryActivityId) ? (data.activities||[]).find(x=>x.id===e.primaryActivityId) : null;
    const otherLines=linkedActivities(e.id).filter(a=>!managed||a.id!==managed.id).length;
    // Organising entity (by id) and its cluster
    const orgEntId=e.entityId||"";
    const orgEnt=orgEntId?S.entityById(orgEntId):null;
    const initialCluster=(orgEnt?(orgEnt.group||""):"")||e.cluster||"";
    // Budget entity defaults to the organising entity, else the managed line's entity
    const presetEntityId=orgEntId||(managed?managed.entityId:"")||"";
    const presetTypeId=e.activityTypeId||(managed?managed.activityTypeId:"")||"";
    const presetStatusId=managed?managed.statusId:defaultStatusId();
    const bFG=managed?(managed.forecastGross||0):0, bFP=managed?(managed.forecastPartner||0):0;
    const bAG=managed?(managed.actualGross||0):0, bAP=managed?(managed.actualPartner||0):0;
    const bPO=managed?(managed.poNumber||""):"";
    const presetApCatId=(managed&&managed.apCategoryId)||((S.actTypeById(presetTypeId)||{}).apCategoryId)||"";
    const presetVendor=managed?(managed.vendor||""):"";

    // Outcomes prefill
    const oc=e.outcomes||{};
    const ov=(key,sub)=>{ const o=oc[key]||{}; return (o[sub]!==undefined&&o[sub]!=="")?o[sub]:""; };
    const outcomesHtml=`
      <h3 style="margin:14px 0 4px">Outcomes / results</h3>
      <p class="muted small" style="margin:0 0 8px">Track planned vs achieved for this campaign. These feed the Outcomes report. Revenue uses potential vs actual.</p>
      <div class="oc-grid">
        <div class="oc-head">Metric</div><div class="oc-head">Target / potential</div><div class="oc-head">Actual</div>
        ${S.OUTCOME_METRICS.map(m=>{
          const subT=m.kind==="pa"?"p":"t";
          const ph=m.money?"EUR":"#";
          const step=m.money?"0.01":"1";
          return `<label class="oc-lab">${m.label}${m.money?' <span class="muted small">(EUR)</span>':''}</label>
            <input id="c-oc-${m.key}-t" type="number" step="${step}" min="0" placeholder="${ph}" value="${ov(m.key,subT)}" />
            <input id="c-oc-${m.key}-a" type="number" step="${step}" min="0" placeholder="${ph}" value="${ov(m.key,'a')}" />`;
        }).join("")}
      </div>
    `;

    // Cluster + organising entity come from the entities hierarchy (Cluster > Entity).
    // Cluster filters the entity list; picking an entity sets the cluster.
    const clusters=Array.from(new Set(uniqueEnts.map(x=>(x.group||"").trim()).filter(Boolean)));
    if(initialCluster && !clusters.includes(initialCluster)) clusters.push(initialCluster);
    clusters.sort();
    const optByName=(arr,sel)=>'<option value="">Select...</option>'+arr.map(n=>`<option ${sel===n?"selected":""} value="${S.escapeHtml(n)}">${S.escapeHtml(n)}</option>`).join("");
    // Organising entity options (value = entity id), filtered by cluster.
    const entOptions=(cluster,selId)=>{
      const list=cluster ? uniqueEnts.filter(x=>(x.group||"")===cluster) : uniqueEnts;
      return '<option value="">Select...</option>'+list.map(x=>`<option ${selId===x.id?"selected":""} value="${x.id}">${S.escapeHtml(x.name)}</option>`).join("");
    };
    // Owner options (value = user id).
    const ownerOptions=(selId)=>'<option value="">Select...</option>'+S.activeOwnerOptions(selId);

    // Existing budget lines (for linking) and the budget-section mode
    const linkedExisting=(data.activities||[]).filter(a=>(a.eventIds||[]).includes(e.id));
    const bMode = managed ? "new" : (linkedExisting.length>0 ? "existing" : (isEdit ? "none" : "new"));
    const existingLinesHtml=(data.activities||[]).slice()
      .sort((x,y)=>(x.name||"").localeCompare(y.name||""))
      .map(a=>{
        const ent=a.entityId?S.entityById(a.entityId):null;
        const net=((a.actualGross||0)-(a.actualPartner||0))||((a.forecastGross||0)-(a.forecastPartner||0));
        const sel=(a.eventIds||[]).includes(e.id);
        const lbl=`${a.name||"(no name)"} - ${ent?ent.name:"no entity"} - ${S.fmtMoney(net)}`;
        return `<label class="bx-item" data-id="${a.id}" data-name="${S.escapeHtml(lbl.toLowerCase())}" style="display:flex; align-items:center; gap:8px; padding:3px 4px; font-size:13px; cursor:pointer; border-radius:4px;"><input type="checkbox" class="bx-chk" value="${a.id}" ${sel?"checked":""}/> <span>${S.escapeHtml(lbl)}</span></label>`;
      }).join("");

    const modal=S.openModal(`
      <h2>${isEdit?"Edit campaign / event":"New campaign / event"}</h2>
      <div class="row">
        <div><label>Name *</label><input id="c-name" type="text" value="${S.escapeHtml(e.name)}" /></div>
        <div><label>Kind</label><select id="c-kind">${opt([["Event","Event"],["Campaign","Campaign"]],e.kind||"Event")}</select></div>
      </div>
      <div class="row-3">
        <div><label>Start *</label><input id="c-start" type="date" value="${e.start||""}" /></div>
        <div><label>End</label><input id="c-end" type="date" value="${e.end||""}" /></div>
        <div><label>Owner</label><select id="c-owner">${ownerOptions(e.ownerId||"")}</select></div>
      </div>
      <div class="row-3">
        <div><label>Cluster</label><select id="c-cluster">${optByName(clusters,initialCluster)}</select></div>
        <div><label>Organising entity</label><select id="c-entity">${entOptions(initialCluster, orgEntId)}</select></div>
        <div><label>SVP</label>
          <select id="c-svp"><option value="">Select...</option>${(data.settings.svps||[]).map(s=>`<option ${e.svpId===s.id?"selected":""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}</select></div>
      </div>
      <div class="row-3">
        <div id="c-campaign-wrap"${e.kind==="Campaign"?' style="display:none"':''}><label>Part of campaign</label>
          <select id="c-campaign"><option value="">(none)</option>${(data.events||[]).filter(x=>x.kind==="Campaign" && x.id!==e.id).slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(c=>`<option ${e.campaignId===c.id?"selected":""} value="${c.id}">${S.escapeHtml(c.name||"(unnamed)")}</option>`).join("")}</select></div>
        <div><label>Campaign code</label><input id="c-code" type="text" value="${S.escapeHtml(e.campaignCode||"")}" /></div>
        <div></div>
      </div>
      <label>Notes</label>
      <textarea id="c-info">${S.escapeHtml(e.info||"")}</textarea>

      ${countriesPickerHtml(data, e.countryIds)}

      <h3 style="margin:12px 0 4px">Partners</h3>
      <div class="tl-rowset" id="c-partners"></div>
      <button class="link" id="c-addpartner" type="button">+ Add partner</button>

      <h3 style="margin:12px 0 4px">Content &amp; assets</h3>
      <div class="tl-rowset" id="c-content"></div>
      <button class="link" id="c-addcontent" type="button">+ Add content link</button>

      <datalist id="c-partnerlist">${partnerNames.map(n=>`<option value="${S.escapeHtml(n)}"></option>`).join("")}</datalist>

      <h3 style="margin:14px 0 4px">Budget</h3>
      <p class="muted small" style="margin:0 0 8px">Link existing budget line(s), create a new one, or leave it out for an agenda-only item. A new line uses the same fields as a normal budget line; name, dates, organising entity, owner and SVP are taken from the event above.</p>
      <label>Budget line</label>
      <select id="c-bmode">
        <option value="new" ${bMode==="new"?"selected":""}>Create a new budget line from this campaign</option>
        <option value="existing" ${bMode==="existing"?"selected":""}>Link existing budget line(s)</option>
        <option value="none" ${bMode==="none"?"selected":""}>No budget line (agenda only)</option>
      </select>
      <div id="c-bnew" ${bMode==="new"?"":"hidden"}>
        <div class="row-3">
          <div><label>Type (activity type) *</label>
            <select id="c-type"><option value="">Select...</option>${(data.settings.activityTypes||[]).map(t=>`<option ${presetTypeId===t.id?"selected":""} value="${t.id}">${S.escapeHtml(t.name)}</option>`).join("")}</select></div>
          <div><label>A&amp;P category</label>
            <select id="c-bapcat"><option value="">Select...</option>${(data.settings.apCategories||[]).map(c=>`<option ${presetApCatId===c.id?"selected":""} value="${c.id}">${S.escapeHtml(c.name)}</option>`).join("")}</select></div>
          <div><label>Status</label>
            <select id="c-bstatus"><option value="">Select...</option>${(data.settings.statuses||[]).map(s=>`<option ${presetStatusId===s.id?"selected":""} value="${s.id}">${S.escapeHtml(s.name)}</option>`).join("")}</select></div>
        </div>
        <div class="row-3">
          <div><label>Vendor / Partner</label><input id="c-bvendor" type="text" value="${S.escapeHtml(presetVendor)}" /></div>
          <div><label>PO number</label><input id="c-bpo" type="text" value="${S.escapeHtml(bPO)}" /></div>
          <div></div>
        </div>
        <div class="row-3">
          <div><label>Forecast gross (EUR)</label><input id="c-bfg" type="number" step="0.01" value="${bFG}" /></div>
          <div><label>Forecast partner (EUR)</label><input id="c-bfp" type="number" step="0.01" value="${bFP}" title="Auto-filled from the partner co-funding amounts below" /></div>
          <div><label>&nbsp;</label><div class="muted small" style="padding-top:8px">Net = gross - partner</div></div>
        </div>
        <div class="row-3">
          <div><label>Actual gross (EUR)</label><input id="c-bag" type="number" step="0.01" value="${bAG}" /></div>
          <div><label>Actual partner (EUR)</label><input id="c-bap" type="number" step="0.01" value="${bAP}" /></div>
          <div></div>
        </div>
      </div>
      <div id="c-bexisting" ${bMode==="existing"?"":"hidden"}>
        <label>Existing budget lines</label>
        <div id="c-bexsel" class="chip-list" style="margin:4px 0 6px"></div>
        <input id="c-bexfilter" type="text" placeholder="Type to filter budget lines..." style="margin-bottom:6px" />
        <div id="c-bexlist" style="max-height:180px; overflow:auto; border:1px solid #eef0f3; border-radius:6px; padding:4px 6px;">${existingLinesHtml}</div>
        <p class="muted small">Tick the lines this campaign belongs to. A line can serve several campaigns.</p>
      </div>

      ${outcomesHtml}

      ${isEdit ? `<div class="muted small" style="margin-top:12px; border-top:1px solid #eef0f3; padding-top:8px;">
        Created by ${S.escapeHtml((e.createdBy && S.userById(e.createdBy) ? S.userById(e.createdBy).name : "") || "-")} on ${tlFmtDT(e.createdAt)}
        &middot; Last updated by ${S.escapeHtml((e.updatedBy && S.userById(e.updatedBy) ? S.userById(e.updatedBy).name : "") || "-")} on ${tlFmtDT(e.updatedAt)}
      </div>` : ""}

      <div class="actions" style="margin-top:16px">
        <button class="secondary" id="c-cancel">Cancel</button>
        ${isEdit?'<button class="secondary" id="c-delete" style="color:#a00">Delete</button>':''}
        <button class="primary" id="c-save">${isEdit?"Save":"Create"}</button>
      </div>
    `, { closeOnBackdrop:false });

    // Cluster <-> organising entity cascade (entity value = id), budget entity follows it.
    const clusterSel=modal.querySelector("#c-cluster");
    const entitySel=modal.querySelector("#c-entity");
    function syncBudgetEntity(){
      const bclu=modal.querySelector("#c-bcluster");
      const bsel=modal.querySelector("#c-bentity");
      if(!bsel || !entitySel.value) return;
      // By default the budget line follows the campaign's organising entity and its cluster.
      const ent=uniqueEnts.find(x=>x.id===entitySel.value);
      const g=ent?(ent.group||""):"";
      if(bclu) bclu.value=g;
      bsel.innerHTML=entOptions(g, entitySel.value);
    }
    // Budget cluster filters the budget entity list, the same cascade as the campaign part above.
    const bClusterSel=modal.querySelector("#c-bcluster");
    const bEntitySel=modal.querySelector("#c-bentity");
    if(bClusterSel) bClusterSel.onchange=()=>{
      const curId=bEntitySel.value;
      const ent=curId?uniqueEnts.find(x=>x.id===curId):null;
      const keep=!bClusterSel.value || (ent && (ent.group||"")===bClusterSel.value);
      bEntitySel.innerHTML=entOptions(bClusterSel.value, keep?curId:"");
    };
    if(bEntitySel) bEntitySel.onchange=()=>{
      const ent=bEntitySel.value?uniqueEnts.find(x=>x.id===bEntitySel.value):null;
      if(bClusterSel) bClusterSel.value=ent?(ent.group||""):"";
    };
    clusterSel.onchange=()=>{
      const curId=entitySel.value;
      const ent=curId?uniqueEnts.find(x=>x.id===curId):null;
      const keep=!clusterSel.value || (ent && (ent.group||"")===clusterSel.value);
      entitySel.innerHTML=entOptions(clusterSel.value, keep?curId:"");
      syncBudgetEntity();
    };
    entitySel.onchange=()=>{
      const ent=entitySel.value?uniqueEnts.find(x=>x.id===entitySel.value):null;
      clusterSel.value=ent?(ent.group||""):"";
      // Default the campaign owner to the organising entity's default owner (still editable).
      if(ent && ent.defaultOwnerId){ const o=modal.querySelector("#c-owner"); if(o) o.value=ent.defaultOwnerId; }
      syncBudgetEntity();
    };

    // End date can never be before the start. Picking a start fills the end with the same day
    // (when empty or earlier) and blocks earlier dates, while staying editable for multi-day items.
    const startEl=modal.querySelector("#c-start"), endEl=modal.querySelector("#c-end");
    if(startEl&&endEl){
      const syncEnd=()=>{
        if(startEl.value) endEl.min=startEl.value;
        if(startEl.value && (!endEl.value || endEl.value<startEl.value)) endEl.value=startEl.value;
      };
      if(startEl.value) endEl.min=startEl.value;
      startEl.onchange=syncEnd;
    }

    // Kind drives a default activity type: Event -> "Event"; Campaign -> "Digital campaign"
    // (or Lead generation). Auto-filled on change, still editable.
    const kindSel=modal.querySelector("#c-kind"), typeSelEl=modal.querySelector("#c-type");
    if(kindSel && typeSelEl){
      const typeIdBy=(names)=>{ for(const n of names){ const t=(data.settings.activityTypes||[]).find(x=>(x.name||"").trim().toLowerCase()===n); if(t) return t.id; } return ""; };
      kindSel.onchange=()=>{
        const id = kindSel.value==="Campaign"
          ? typeIdBy(["digital campaign","lead generation campaigns","lead generation campaign"])
          : typeIdBy(["event"]);
        if(id) typeSelEl.value=id;
        // A campaign is not "part of" another campaign, so hide that field for campaigns.
        const cw=modal.querySelector("#c-campaign-wrap"); if(cw) cw.style.display=(kindSel.value==="Campaign")?"none":"";
      };
    }

    const bexFilter=modal.querySelector("#c-bexfilter");
    if(bexFilter) bexFilter.oninput=()=>{
      const q=bexFilter.value.trim().toLowerCase();
      modal.querySelectorAll("#c-bexlist .bx-item").forEach((el)=>{
        el.style.display = (!q || (el.dataset.name||"").includes(q)) ? "flex" : "none";
      });
    };
    // Existing budget lines: checkbox list with a "selected on top" chip bar for a clear overview
    // and easy removal. Ticking updates the chips; a chip's x unticks its line.
    const bexListBox=modal.querySelector("#c-bexlist");
    const bexSel=modal.querySelector("#c-bexsel");
    function renderBexSel(){
      if(!bexSel||!bexListBox) return;
      const chosen=[...bexListBox.querySelectorAll("input.bx-chk:checked")].map(cb=>{
        const item=cb.closest(".bx-item");
        return { id:cb.value, label:(item?item.querySelector("span").textContent:cb.value) };
      });
      if(!chosen.length){ bexSel.innerHTML=`<span class="muted small">None selected yet. Tick lines below.</span>`; return; }
      bexSel.innerHTML=`<span class="muted small" style="width:100%">Selected (${chosen.length}):</span>`+chosen.map(c=>
        `<span class="chip" data-id="${c.id}" style="background:#e8f0fe">${S.escapeHtml(c.label)}<button type="button" class="bx-remove" data-id="${c.id}" title="Remove">×</button></span>`).join("");
      bexSel.querySelectorAll(".bx-remove").forEach(btn=>{
        btn.onclick=()=>{ const cb=bexListBox.querySelector(`input.bx-chk[value="${btn.dataset.id}"]`); if(cb){ cb.checked=false; renderBexSel(); } };
      });
    }
    if(bexListBox){
      bexListBox.querySelectorAll("input.bx-chk").forEach(cb=>{ cb.onchange=renderBexSel; });
      renderBexSel();
    }
    // Budget mode toggle
    modal.querySelector("#c-bmode").onchange=(ev)=>{
      const m=ev.target.value;
      modal.querySelector("#c-bnew").hidden = (m!=="new");
      modal.querySelector("#c-bexisting").hidden = (m!=="existing");
      if(m==="new") recomputePartnerBudget();
    };
    // Default the A&P category to the chosen type's category (still editable).
    const cTypeSel=modal.querySelector("#c-type"), cApcatSel=modal.querySelector("#c-bapcat");
    if(cTypeSel && cApcatSel) cTypeSel.addEventListener("change", ()=>{ const t=S.actTypeById(cTypeSel.value); if(t && t.apCategoryId) cApcatSel.value=t.apCategoryId; });

    // Countries picker: group chips tick their members, search filters the list, clear/copy helpers.
    const coListBox=modal.querySelector("#c-country-list");
    if(coListBox){
      const setChecked=(ids,on)=>{ (ids||[]).forEach(id=>{ const cb=coListBox.querySelector(`input.cco[value="${id}"]`); if(cb) cb.checked=on; }); };
      modal.querySelectorAll(".cco-group").forEach(btn=>{
        btn.onclick=()=>setChecked((btn.dataset.ids||"").split(",").filter(Boolean), true);
      });
      const clearBtn=modal.querySelector(".cco-clear");
      if(clearBtn) clearBtn.onclick=()=>coListBox.querySelectorAll("input.cco").forEach(cb=>cb.checked=false);
      const lastBtn=modal.querySelector(".cco-last");
      if(lastBtn) lastBtn.onclick=()=>setChecked(lastCountryIds, true);
      const coSearch=modal.querySelector("#c-country-search");
      if(coSearch) coSearch.oninput=()=>{
        const q=coSearch.value.trim().toLowerCase();
        coListBox.querySelectorAll(".cco-item").forEach(el=>{ el.style.display=(!q||(el.dataset.name||"").includes(q))?"":"none"; });
      };
    }

    const partnersBox=modal.querySelector("#c-partners");
    const contentBox=modal.querySelector("#c-content");
    function partnerRow(p){
      p=p||{name:"",role:"",coFunding:""};
      const div=document.createElement("div"); div.className="line";
      div.innerHTML=`
        <input type="text" list="c-partnerlist" placeholder="Partner name" value="${S.escapeHtml(p.name||"")}" />
        <input type="text" placeholder="Role (e.g. co-host, sponsor)" value="${S.escapeHtml(p.role||"")}" />
        <input type="number" step="0.01" class="pf-cof" placeholder="Co-funding EUR" value="${p.coFunding!==undefined&&p.coFunding!==""?p.coFunding:""}" />
        <button class="tl-iconbtn" type="button" title="Remove">&times;</button>`;
      div.querySelector(".pf-cof").oninput=recomputePartnerBudget;
      div.querySelector(".tl-iconbtn").onclick=()=>{ div.remove(); recomputePartnerBudget(); };
      partnersBox.appendChild(div);
    }
    // Total partner co-funding drives the budget line's Forecast partner, so it is not typed twice.
    function recomputePartnerBudget(){
      const bfp=modal.querySelector("#c-bfp");
      if(!bfp) return; // only when creating a new budget line
      let sum=0, any=false;
      partnersBox.querySelectorAll("input.pf-cof").forEach(inp=>{
        const t=(inp.value||"").trim();
        if(t!==""){ const v=parseFloat(t); if(!isNaN(v)){ sum+=v; any=true; } }
      });
      if(any) bfp.value=sum;
    }
    function contentRow(c){
      c=c||{label:"",url:""};
      const div=document.createElement("div"); div.className="line content";
      div.innerHTML=`
        <input type="text" placeholder="Label (e.g. Brochure)" value="${S.escapeHtml(c.label||"")}" />
        <input type="text" placeholder="URL or path" value="${S.escapeHtml(c.url||"")}" />
        <button class="tl-iconbtn" type="button" title="Remove">&times;</button>`;
      div.querySelector(".tl-iconbtn").onclick=()=>div.remove();
      contentBox.appendChild(div);
    }
    (e.partners||[]).forEach(partnerRow);
    (e.content||[]).forEach(contentRow);
    recomputePartnerBudget();
    modal.querySelector("#c-addpartner").onclick=()=>partnerRow();
    modal.querySelector("#c-addcontent").onclick=()=>contentRow();

    modal.querySelector("#c-cancel").onclick=S.closeModal;
    if(isEdit){
      modal.querySelector("#c-delete").onclick=async()=>{
        const linked=linkedActivities(id).length;
        const msg=linked?`Delete "${e.name}"? ${linked} linked budget line(s) will stay but lose their link.`:`Delete "${e.name}"?`;
        const ok=await S.confirmDialog(msg);
        if(!ok) return;
        data.events=data.events.filter(x=>x.id!==id);
        linkedActivities(id).forEach(a=>{ a.eventIds=(a.eventIds||[]).filter(x=>x!==id); });
        S.scheduleSave(); S.notify(); S.closeModal(); S.toast("Campaign deleted","success");
      };
    }
    modal.querySelector("#c-save").onclick=async()=>{
      const name=modal.querySelector("#c-name").value.trim();
      const start=modal.querySelector("#c-start").value;
      const bmode=modal.querySelector("#c-bmode").value;
      const orgEntityId=modal.querySelector("#c-entity").value;
      const typeFromField=modal.querySelector("#c-type").value;
      const selectedExisting=[...modal.querySelectorAll("#c-bexlist input.bx-chk:checked")].map(cb=>cb.value);
      // Activity type lives on the budget line. For a new line it comes from the Type field; when
      // linking existing lines the event inherits the type of the first linked line.
      let activityTypeId=typeFromField;
      if(bmode==="existing"){
        const fl=(data.activities||[]).find(x=>x.id===selectedExisting[0]);
        activityTypeId = fl ? (fl.activityTypeId||"") : (e.activityTypeId||"");
      }
      if(!name) return S.toast("Name is required","error");
      if(!start) return S.toast("Start date is required","error");
      if(bmode==="new" && !typeFromField) return S.toast("Activity type is required for the budget line.","error");
      if(bmode==="new" && !orgEntityId) return S.toast("Set the organising entity above to create a budget line.","error");
      if(bmode==="existing" && selectedExisting.length===0) return S.toast("Pick at least one existing budget line, or switch to create a new one.","error");
      const end=modal.querySelector("#c-end").value;
      if(end && end<start) return S.toast("End date cannot be before the start date","error");

      const partners=[...partnersBox.querySelectorAll(".line")].map(div=>{
        const i=div.querySelectorAll("input");
        return { name:i[0].value.trim(), role:i[1].value.trim(), coFunding:parseFloat(i[2].value)||0 };
      }).filter(p=>p.name);
      const content=[...contentBox.querySelectorAll(".line")].map(div=>{
        const i=div.querySelectorAll("input");
        return { label:i[0].value.trim(), url:i[1].value.trim() };
      }).filter(c=>c.label||c.url);

      // grow partner master list with any new names
      const master=data.settings.partners=data.settings.partners||[];
      partners.forEach(p=>{
        if(!master.some(m=>(m.name||"").trim().toLowerCase()===p.name.toLowerCase()))
          master.push({id:API.uid(),name:p.name});
      });

      // ---- Budget link ----
      const at=S.actTypeById(activityTypeId);
      const typeCatId=(at&&at.apCategoryId)||"";
      const svpId=modal.querySelector("#c-svp").value;
      const kindVal=modal.querySelector("#c-kind").value;
      const campaignId=(kindVal==="Campaign")?"":((modal.querySelector("#c-campaign")||{}).value||"");
      let primaryId=e.primaryActivityId||"";
      if(bmode==="new"){
        // Create or update the campaign's dedicated line from this campaign's details.
        const bStatus=modal.querySelector("#c-bstatus").value;
        const fg=parseFloat(modal.querySelector("#c-bfg").value)||0;
        const fp=parseFloat(modal.querySelector("#c-bfp").value)||0;
        const ag=parseFloat(modal.querySelector("#c-bag").value)||0;
        const ap=parseFloat(modal.querySelector("#c-bap").value)||0;
        const bpo=modal.querySelector("#c-bpo").value.trim();
        const bapc=modal.querySelector("#c-bapcat").value;
        const bvendor=modal.querySelector("#c-bvendor").value.trim();
        let line=primaryId ? (data.activities||[]).find(x=>x.id===primaryId) : null;
        const isNewLine=!line;
        if(isNewLine){
          line={ id:API.uid(), eventIds:[], svpId:"", apCategoryId:"", vendor:"", poNumber:"", notes:"",
                 createdBy:S.state.currentUserId, createdAt:new Date().toISOString() };
          (data.activities=data.activities||[]).push(line);
          primaryId=line.id;
        }
        const beforeSig=isNewLine?null:contentSig(line);
        const links=new Set(line.eventIds||[]); links.add(e.id);
        Object.assign(line,{
          name, date:start, eventIds:Array.from(links), entityId:orgEntityId, svpId,
          activityTypeId:typeFromField, apCategoryId:(bapc||typeCatId), statusId:bStatus,
          ownerId:(modal.querySelector("#c-owner").value||line.ownerId||S.state.currentUserId||""),
          vendor:bvendor, poNumber:bpo,
          forecastGross:fg, forecastPartner:fp, actualGross:ag, actualPartner:ap,
        });
        // Stamp the managed line's update only if it already existed and its content changed.
        if(!isNewLine && contentSig(line)!==beforeSig){
          line.updatedBy=S.state.currentUserId; line.updatedAt=new Date().toISOString();
        }
      } else if(bmode==="existing"){
        // Link this campaign into the selected existing lines; unlink from any deselected.
        const sel=new Set(selectedExisting);
        (data.activities||[]).forEach(a=>{
          const has=(a.eventIds||[]).includes(e.id);
          if(sel.has(a.id) && !has) a.eventIds=[...(a.eventIds||[]), e.id];
          else if(!sel.has(a.id) && has) a.eventIds=(a.eventIds||[]).filter(x=>x!==e.id);
        });
        primaryId=""; // no dedicated managed line when linking existing
      } else {
        // bmode "none" (agenda only): detach any budget. Unlink this event from all budget lines,
        // and delete the campaign's own dedicated line if it is now orphaned. Shared lines that
        // still serve other campaigns are only unlinked, never deleted.
        const primaryLineId=e.primaryActivityId;
        (data.activities||[]).forEach(a=>{ if((a.eventIds||[]).includes(e.id)) a.eventIds=(a.eventIds||[]).filter(x=>x!==e.id); });
        if(primaryLineId){
          const idx=(data.activities||[]).findIndex(x=>x.id===primaryLineId);
          if(idx>=0 && ((data.activities[idx].eventIds||[]).length===0)) data.activities.splice(idx,1);
        }
        primaryId="";
      }

      // Outcomes
      const outcomes={};
      S.OUTCOME_METRICS.forEach(m=>{
        const subT=m.kind==="pa"?"p":"t";
        const tv=parseFloat(modal.querySelector(`#c-oc-${m.key}-t`).value)||0;
        const av=parseFloat(modal.querySelector(`#c-oc-${m.key}-a`).value)||0;
        if(tv||av){ outcomes[m.key]=m.kind==="pa"?{p:tv,a:av}:{t:tv,a:av}; }
      });

      // Cluster comes from the organising entity (the same entity list budget lines use), so the
      // two can never diverge. Fall back to the manually picked cluster only when there is no entity.
      const orgEntity=orgEntityId?S.entityById(orgEntityId):null;
      const cluster=orgEntity?(orgEntity.group||""):modal.querySelector("#c-cluster").value;

      const countryIds=[...modal.querySelectorAll("#c-country-list input.cco:checked")].map(x=>x.value);
      try { localStorage.setItem("mb_last_country_ids", JSON.stringify(countryIds)); lastCountryIds=countryIds.slice(); } catch(err) {}
      const base={
        ...e, name, kind:kindVal,
        activityTypeId,
        start, end: end||"",
        entityId:orgEntityId,
        cluster,
        ownerId:modal.querySelector("#c-owner").value,
        svpId, campaignId,
        campaignCode:modal.querySelector("#c-code").value.trim(),
        info:modal.querySelector("#c-info").value,
        countryIds,
        partners, content, outcomes,
        primaryActivityId:primaryId,
        entity:undefined, owner:undefined, type:undefined, globalCampaignId:undefined, // drop legacy fields
      };
      // Stamp "updated by/on" only when the campaign content really changed (not a no-op save).
      let updated=base;
      if(isEdit && contentSig(base)!==contentSig(e)){
        updated={ ...base, updatedBy:S.state.currentUserId, updatedAt:new Date().toISOString() };
      }
      if(isEdit){ const idx=data.events.findIndex(x=>x.id===id); data.events[idx]=updated; }
      else data.events.push(updated);
      S.scheduleSave(); S.notify(); S.closeModal();
      S.toast((isEdit?"Campaign updated":"Campaign created")+" and linked to the budget","success");
    };
  }

  // Countries last tagged on an event, remembered so "Copy from last" is quick across forms.
  let lastCountryIds = [];
  try { lastCountryIds = JSON.parse(localStorage.getItem("mb_last_country_ids") || "[]") || []; } catch(e) { lastCountryIds = []; }

  // Country picker for the event form: one-click group chips, a searchable checklist, and a
  // "copy from last" shortcut. Countries are just tags (relevance), not tied to budget.
  function countriesPickerHtml(data, selectedIds){
    const sel = new Set(selectedIds || []);
    const countries = (data.settings.countries || []).slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"",undefined,{sensitivity:"base"}));
    const groups = (data.settings.countryGroups || []).slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"",undefined,{sensitivity:"base"}));
    if(!countries.length){
      return `<h3 style="margin:12px 0 4px">Countries</h3><p class="muted small">No countries defined yet. An admin can add them in Settings.</p>`;
    }
    const pill = "display:inline-flex; align-items:center; gap:5px; border:1px solid #e5e7eb; border-radius:14px; padding:3px 9px; font-size:12px; cursor:pointer; margin:2px;";
    const gpill = "border:1px solid #cbd5e1; background:#f1f5f9; border-radius:14px; padding:3px 10px; font-size:12px; cursor:pointer; margin:2px;";
    const groupChips = groups.map(g=>`<button type="button" class="cco-group" data-ids="${(g.countryIds||[]).join(',')}" style="${gpill}" title="Tick all countries in ${S.escapeHtml(g.name)}">+ ${S.escapeHtml(g.name)}</button>`).join("");
    const boxes = countries.map(c=>`<label class="cco-item" data-name="${S.escapeHtml((c.name||'').toLowerCase())}" style="${pill}"><input type="checkbox" class="cco" value="${c.id}" ${sel.has(c.id)?"checked":""}/> ${S.escapeHtml(c.name)}${c.global?' <span class="muted small">(global)</span>':''}</label>`).join("");
    const helpers = `${groupChips}${lastCountryIds.length?`<button type="button" class="cco-last" style="${gpill}" title="Use the countries from the last event you tagged">Copy from last</button>`:''}<button type="button" class="cco-clear" style="${gpill}" title="Clear all">Clear</button>`;
    return `
      <h3 style="margin:12px 0 4px">Countries <span class="muted small">(who is this relevant to?)</span></h3>
      <div style="margin-bottom:6px">${helpers}</div>
      <input id="c-country-search" type="text" placeholder="Type to filter countries..." style="margin-bottom:6px" />
      <div id="c-country-list" style="max-height:160px; overflow:auto; border:1px solid #eef0f3; border-radius:6px; padding:4px 6px;">${boxes}</div>`;
  }

  // Signature of a record's content, ignoring audit fields, to tell a real edit from a no-op save.
  function contentSig(o){
    const skip={createdAt:1,updatedAt:1,createdBy:1,updatedBy:1};
    const c={}; Object.keys(o).sort().forEach(k=>{ if(!skip[k]) c[k]=o[k]; });
    return JSON.stringify(c);
  }

  window.MB_TIMELINE = { render };
})();
