# Standalone AI-agent / agentic-AI market forecasts (current editions). Values USD billions.
# (publisher, market name, base_year, base_val, fc_year, fc_val, cagr%, cagr_from_year, cagr_from_val, published, seen)
F=[
("MarketsandMarkets","AI Agents Market",2025,7.84,2030,52.62,46.3,None,None,"Apr 2025","publisher release"),
("BCC Research","AI Agents: Technologies, Applications and Global Markets",2025,8.0,2030,48.3,43.3,None,None,"Oct 2025","publisher release"),
("The Business Research Company","AI Agents Global Market Report",2025,8.29,2030,53.2,44.9,None,None,"Feb 2026","secondary (2030 value)"),
("Fortune Business Insights","AI Agents Market",2025,8.03,2034,251.38,46.61,2026,11.78,"Jul 2026","publisher page"),
("Precedence Research","AI Agents Market",2025,7.92,2034,236.03,45.82,2025,7.92,"Jul 2025","secondary"),
("Grand View Research","AI Agents Market",2025,7.63,2033,182.97,49.6,2026,10.9,"2026","publisher page"),
("Global Market Insights","AI Agents Market",2025,7.7,2034,105.6,39.5,2026,10.2,"Jul 2025","publisher page"),
("Polaris Market Research","AI Agent Market",2025,7.1,2034,179.8,43.2,2025,7.1,"n/a","publisher release"),
("Roots Analysis","AI Agents Market",2026,15.0,2035,221.0,34.64,2026,15.0,"n/a","secondary"),
("Verified Market Research","AI Agents Market",None,None,2032,51.58,38.5,None,None,"Apr 2025","publisher release"),
("MarketsandMarkets","Agentic AI Market (2033 edition)",2026,19.33,2033,205.88,40.2,2026,19.33,"2026","publisher release"),
("Grand View Research","Agentic AI Market",2025,16.2,2033,224.5,38.6,2026,22.9,"2026","publisher page"),
("Fortune Business Insights","Agentic AI Market",2025,7.29,2034,139.19,40.5,2026,9.14,"Aug 2026","publisher page"),
("Precedence Research","Agentic AI Market",2025,7.55,2034,199.05,43.84,2025,7.55,"Sep 2025","publisher page"),
("Mordor Intelligence","Agentic AI Market",2025,6.96,2031,57.42,42.14,2026,9.89,"2026","reseller listing"),
("Straits Research","Agentic AI Market",2025,8.31,2033,154.84,44.21,2025,8.31,"n/a","secondary"),
("KBV Research","Agentic AI Market",None,None,2032,77.48,42.4,None,None,"Mar 2026","publisher release"),
("DataM Intelligence","Agentic AI Market",2025,4.54,2033,98.26,None,None,None,"Feb 2026","secondary"),
("GlobalData","Agentic AI (market opportunity)",2024,6.36,2029,45.39,48.17,None,None,"n/a","secondary"),
("Emergen Research","Agentic AI Market",2025,5.20,2035,52.40,26.0,None,None,"n/a","publisher page"),
("MarketsandMarkets","Enterprise Agentic AI Market",2025,6.76,2030,46.04,47.0,None,None,"n/a","publisher release"),
("Omdia","Enterprise agentic AI software",2025,1.5,2030,41.8,None,None,None,"Sep 2025","publisher release"),
]
def v2030(r):
    pub,name,by,bv,fy,fv,c,cfy,cfv,_,_=r
    if fy==2030: return fv,False
    if fy and fy>2030 and c: return fv/((1+c/100)**(fy-2030)),True   # back from forecast year at stated CAGR
    if fy==2029 and c: return fv*(1+c/100),True
    if c is None and bv and fy: g=(fv/bv)**(1/(fy-by)); return fv/(g**(fy-2030)),True
    return None,None
rows=[]
for r in F:
    v,d=v2030(r); rows.append((r,round(v,1),d))
if __name__=='__main__':
    for r,v,d in sorted(rows,key=lambda x:x[1]):
        print(f"{r[0]:32s} {r[1][:34]:34s} 2030={v:6.1f} {'DERIVED' if d else 'stated'}")
    vals=sorted(v for r,v,d in rows if not r[1].startswith(('Enterprise',)) and r[0]!='Omdia')
    import statistics as s; print('n',len(vals),'median',s.median(vals),'min',vals[0],'max',vals[-1], 'IQR', s.quantiles(vals,n=4))
