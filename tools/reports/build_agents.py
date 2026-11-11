import json, html
from agents_data import F, v2030
t=open('tpl-3233.html').read()
css=t[t.find('<style>'):t.find('</style>')+8]
URL='https://report-ai.org/reports/ai-agents-market-size/'
CSV='https://report-ai.org/wp-content/uploads/2026/11/report-ai-data-ai-agents-market-size.csv'
E=lambda s: html.escape(s, quote=False)
def ext(u,txt): return f'<a href="{u}" target="_blank" rel="nofollow noopener">{txt}</a>'
STATED='<span style="color:#77777f;font-size:11px;">stated</span>'
MED='<span class="tai-c tai-c-med">MEDIUM</span>'; DER='<span class="tai-c tai-c-der">DERIVED</span>'
css=css.replace('</style>','.tai-c{display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;padding:2px 6px;border-radius:2px;white-space:nowrap;}.tai-c-med{background:#fdf3e3;color:#9a6a00;}.tai-c-der{background:#eef1fd;color:#2545f5;}.tai-c-hi{background:#e7f5ec;color:#177245;}\n.tai-bar{display:flex;align-items:center;gap:10px;margin:5px 0;font-size:13px;}.tai-bar .l{width:300px;flex:none;color:#33333a;}.tai-bar .t{flex:1;}.tai-bar .b{height:16px;border-radius:0 3px 3px 0;}.tai-bar .v{font-family:\'IBM Plex Mono\',monospace;font-size:12px;width:70px;flex:none;}\n@media(max-width:700px){.tai-bar .l{width:130px;font-size:11.5px;}}\n</style>')
general=[(r,*v2030(r)) for r in F if not r[1].startswith('Enterprise') and r[0]!='Omdia']
general.sort(key=lambda x:x[1])
mx=max(v for _,v,_ in general)
bars=''.join(f'<div class="tai-bar"><span class="l">{E(r[0])} &middot; <span style="color:#77777f;">{E(__import__("re").sub(r" Market$","",r[1]).replace(" Market (", " ("))}</span></span><span class="t"><span class="b" style="display:block;width:{v/mx*100:.1f}%;background:{"#8fa2f8" if d else "#2545f5"};"></span></span><span class="v">${v:.1f}B</span></div>' for r,v,d in general)
def fmt(x): return '&mdash;' if x is None else f'${x:,.2f}B'.replace('.00B','B')
rows=''
for r,v,d in sorted([(r,*v2030(r)) for r in F],key=lambda x:x[1]):
    pub,name,by,bv,fy,fv,c,cfy,cfv,date,seen=r
    rows+=f'<tr><td><strong>{E(pub)}</strong><br><span style="color:#77777f;">{E(name)}</span></td><td>{fmt(bv)+" ("+str(by)+")" if bv else "not stated"}</td><td>{fmt(fv)} ({fy})</td><td>{(str(c)+"%") if c else "not stated"}</td><td><strong>${v:.1f}B</strong> {DER if d else STATED}</td><td>{E(date)}</td><td>{E(seen)} {MED}</td></tr>'
FAQ=[
("How big is the AI agents market?","Research firms put standalone AI-agent revenue at about $7–8 billion in 2025: 12 of the 15 forecasts that give a 2025 figure fall between $7.0 billion and $8.3 billion. For 2030, the median of 20 published forecasts is about $49 billion, with the middle half between roughly $36 billion and $54 billion (Report AI comparison, November 2026)."),
("Why do AI agent market forecasts disagree so much?","Mostly because they measure different things. Research-firm forecasts size revenue from products sold as agents. Gartner's $985 billion for 2030 counts spending on all software with agentic features built in, and IDC's $1.3 trillion for 2029 is total AI spending. Comparing those numbers with each other mixes three different markets."),
("Is the AI agents market worth $206.5 billion in 2026?","Not as a standalone market. Gartner's $206.5 billion for 2026, from a May 2026 press release, is spending on software products with agent capabilities, much of it existing enterprise software. Gartner's own line for standalone AI agents and assistants in its September 2026 forecast is about $29 billion for 2026."),
("What is the difference between 'AI agents' and 'agentic AI' market reports?","There is no agreed difference, but the same research firm often publishes both and gets different numbers. Fortune Business Insights forecasts $251 billion for its AI agents market and $139 billion for its agentic AI market in 2034. Check the definition before comparing any two figures."),
("How many companies actually use AI agents?","Gartner's 2026 Hype Cycle for Agentic AI found 17% of organisations had deployed AI agents. McKinsey's State of AI 2025 survey found 23% scaling an agentic AI system somewhere in the business and 39% experimenting, and its 2026 edition found about 40% of large firms scaling agents. Gartner also predicts over 40% of agentic AI projects will be cancelled by the end of 2027."),
]
faq_html=''.join(f'<p style="font-size:15px;margin:0 0 6px;"><strong>{q}</strong></p><p style="font-size:14.5px;color:#55555e;margin:0 0 18px;">{a}</p>' for q,a in FAQ)
H=f'''<!-- wp:html -->
{css}
<div class="tai-wrap">

<div class="tai-padx" style="padding:48px 36px 36px;">
<div class="tai-mono" style="font-size:11px;color:#9a9aa2;margin-bottom:16px;"><a href="/" style="color:#9a9aa2;text-decoration:none;">Home</a> <span style="color:#d3d3da;">/</span> <a href="/reports/" style="color:#9a9aa2;text-decoration:none;">Reports</a> <span style="color:#d3d3da;">/</span> <span style="color:#111114;">AI Agents Market Size</span></div>
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;margin-bottom:12px;">Market sizing &middot; Report AI</div>
<h1 style="font-weight:900;font-size:clamp(34px,6vw,52px);line-height:1.0;letter-spacing:-0.03em;margin:0 0 16px;">How Big Is the AI Agents Market, Really?</h1>
<p style="font-size:18px;color:#55555e;margin:0 0 14px;">The AI agents market is quoted at $47 billion, $206 billion, $985 billion and $1.3 trillion, often in the same week. We collected 30 published forecasts from 24 firms and put them side by side. Most of the disagreement is about what is being counted, not how fast it is growing.</p>
<div class="tai-mono" style="font-size:12px;color:#9a9aa2;">By the Report AI editorial team &middot; Published <time datetime="2026-11-09">9 November 2026</time> &middot; Cadence: quarterly &middot; Next review February 2027</div>
</div>

<div class="tai-statgrid" style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #e6e6ea;">
<div class="tai-stat"><div style="font-weight:900;font-size:34px;letter-spacing:-0.03em;color:#2545f5;">$7&ndash;8B</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">standalone AI-agent revenue in 2025, in 12 of 15 forecasts that give a 2025 figure {MED}</div></div>
<div class="tai-stat"><div style="font-weight:900;font-size:34px;letter-spacing:-0.03em;color:#2545f5;">$49B</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">median 2030 forecast across 20 general-market forecasts {DER}</div></div>
<div class="tai-stat"><div style="font-weight:900;font-size:34px;letter-spacing:-0.03em;color:#2545f5;">$36&ndash;54B</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">the middle half of those 2030 forecasts {DER}</div></div>
<div class="tai-stat" style="border-right:none;"><div style="font-weight:900;font-size:34px;letter-spacing:-0.03em;color:#2545f5;">$985B</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">Gartner's 2030 figure: spending on all software with agentic features, a different measure {MED}</div></div>
</div>

<div class="tai-padx" style="background:#f5f5f7;">
<div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">Analysis</div>
<h2 style="font-size:30px;">The forecasts agree more than the headlines suggest. The headlines are measuring different markets.</h2>
<p>Put 30 AI-agent forecasts in one table and the first impression is chaos: 2030 figures from $23 billion to $985 billion, a forty-fold spread. Sort them by what they actually count and most of the chaos goes away. The research firms that size a standalone market &mdash; revenue from products sold as AI agents or agent platforms &mdash; start from almost the same place. Twelve of the fifteen that give a 2025 figure put it between $7.0 billion and $8.3 billion. Their 2030 figures, converted to a common year, have a median of about $49 billion, and half of them sit between roughly $36 billion and $54 billion.</p>
<p>The very large numbers are not bolder forecasts of the same thing. Gartner's $985 billion for 2030 and its $206.5 billion for 2026 count spending on all software that has agentic capabilities built in, which includes a large share of existing enterprise application spending as vendors add agents to products customers already buy. IDC's $1.3 trillion for 2029, often quoted as &ldquo;agentic AI spending&rdquo;, is total AI spending, with agentic AI described as its main driver. Bank of America's $155 billion and Goldman Sachs' implied figure of more than $468 billion are top-down estimates of the value agents could capture, not measured revenue. None of these is wrong; each answers a different question.</p>
<p>The useful comparison is within each kind of number. Within the standalone group, the outliers have identifiable causes: Grand View's agentic AI report starts from a 2025 base twice everyone else's, and MarketsandMarkets has published two editions of its agentic AI forecast with different starting points. Labels are not a reliable guide either. &ldquo;AI agents&rdquo; and &ldquo;agentic AI&rdquo; reports from the same firm usually give different figures, so neither term on its own tells you what is inside the number.</p>
<p>Adoption data argues for caution at the high end. Gartner's 2026 Hype Cycle found 17% of organisations had deployed AI agents, McKinsey's 2025 survey found 23% scaling an agentic system somewhere and no more than 10% in any single function, and Gartner itself expects over 40% of agentic AI projects to be cancelled by the end of 2027. The largest disclosed vendor figure, Salesforce's Agentforce at over $1.5 billion of annual recurring revenue in August 2026, was redefined that quarter to include other products. Standalone agent revenue is growing fast from a small base. It is not yet a hundred-billion-dollar market.</p>
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77777f;margin:26px 0 10px;">Key takeaways</div>
<ul style="font-size:15.5px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:0;">
<li style="margin-bottom:8px;"><strong>Quote the standalone market as a range.</strong> About $7&ndash;8 billion in 2025, a median of about $49 billion by 2030, with most forecasts between $36 billion and $54 billion.</li>
<li style="margin-bottom:8px;"><strong>$985 billion, $206.5 billion and $1.3 trillion are different measures.</strong> Embedded software spending and total AI spending are not the size of an &ldquo;AI agents market&rdquo;.</li>
<li style="margin-bottom:8px;"><strong>Check the edition.</strong> Several firms revised their numbers in 2025&ndash;26 and older figures still circulate, such as $47.1 billion for 2030.</li>
<li style="margin-bottom:0;"><strong>Adoption is early.</strong> Around a fifth of organisations are scaling agents, and Gartner forecasts more than 40% of agentic projects will be cancelled by 2027.</li>
</ul>
</div>

<div class="tai-padx">
<h2>Four kinds of number, all called &ldquo;the AI agents market&rdquo;</h2>
<p>Before comparing any two figures, identify which of these it is. Only figures of the same kind can be compared.</p>
<div class="tai-tablewrap"><table class="tai-table">
<tr><th>Kind</th><th>What it counts</th><th>Examples</th><th>2030 figure</th></tr>
<tr><td><strong>1. Standalone agent revenue</strong></td><td>Revenue from products sold as AI agents or agent platforms</td><td>MarketsandMarkets, Grand View, Precedence, Fortune, BCC and 15 others</td><td>Median ~$49B; middle half $36&ndash;54B {DER}</td></tr>
<tr><td><strong>2. Enterprise-only standalone</strong></td><td>As above, enterprise buyers only</td><td>Omdia $41.8B; MarketsandMarkets enterprise $46.0B; Gartner cross-functional agents &gt;$23B</td><td>$23&ndash;46B {MED}</td></tr>
<tr><td><strong>3. Embedded software spending</strong></td><td>All spending on software with agentic features built in</td><td>Gartner: $86.4B (2025), $206.5B (2026), $376.3B (2027), ~$985B (2030)</td><td>~$985B {MED}</td></tr>
<tr><td><strong>4. Value-capture estimates</strong></td><td>What agents could capture, estimated top-down</td><td>Bank of America $155B TAM; Goldman Sachs agents &gt;60% of a $780B app-software market</td><td>$155B to &gt;$468B {DER}</td></tr>
</table></div>
<p style="margin-top:14px;">Total AI spending is a fifth kind that is often mislabelled: IDC's $1.3 trillion for 2029 is all AI spending, described as driven by agentic AI. Commerce figures such as Juniper's $1.5 trillion of agentic commerce in 2030 are transaction values, not software revenue.</p>
</div>

<div class="tai-padx">
<h2>Every standalone forecast, converted to 2030</h2>
<p>Most firms forecast to 2032&ndash;2035. To compare them, we converted each to a 2030 value using its own stated growth rate. Dark bars are the firm's own 2030 figure; light bars are our conversion, labelled DERIVED. Enterprise-only forecasts are in the table below the chart.</p>
<div style="margin:18px 0 10px;max-width:980px;">{bars}</div>
<p class="tai-mono" style="font-size:11px;color:#77777f;margin:6px 0 0;"><span style="display:inline-block;width:10px;height:10px;background:#2545f5;margin-right:5px;"></span>Stated by the forecaster &nbsp; <span style="display:inline-block;width:10px;height:10px;background:#8fa2f8;margin:0 5px 0 12px;"></span>Converted by Report AI at the forecaster's own growth rate (DERIVED)</p>
</div>

<div class="tai-padx">
<h2>The forecasts in full</h2>
<p>Current editions only. Values in US dollars. &ldquo;Seen via&rdquo; records where we read the figure; all are rated MEDIUM because we could not open the full reports.</p>
<div class="tai-tablewrap"><table class="tai-table">
<tr><th>Publisher &amp; market</th><th>Base</th><th>Forecast</th><th>CAGR</th><th>2030 value</th><th>Published</th><th>Seen via</th></tr>
{rows}
</table></div>
<p style="margin-top:14px;font-size:14px;color:#55555e;">Superseded editions still quoted elsewhere: MarketsandMarkets AI agents $47.1B for 2030 (replaced by $52.62B), MarketsandMarkets agentic AI $93.2B for 2032 (replaced by the 2033 edition), Grand View AI agents $50.31B for 2030 (replaced by the 2033 edition). Deloitte's $35B for 2030 is an average of other firms' estimates and is not counted separately.</p>
</div>

<div class="tai-padx">
<h2>The big numbers, and what they measure</h2>
<div class="tai-tablewrap"><table class="tai-table">
<tr><th>Figure as quoted</th><th>What it actually measures</th><th>Source</th><th>Confidence</th></tr>
<tr><td>&ldquo;$206.5B AI agents market in 2026&rdquo;</td><td>Spending on software with agent capabilities, including enterprise apps with agents added ($86.4B in 2025, $376.3B in 2027)</td><td>Gartner press release, 5 May 2026</td><td>{MED}</td></tr>
<tr><td>Gartner's standalone line</td><td>&ldquo;AI agents and assistants&rdquo;: $16.48B (2025), $29.22B (2026), $65.47B (2027)</td><td>Gartner AI spending forecast, 16 Sep 2026</td><td>{MED}</td></tr>
<tr><td>&ldquo;$985B agentic AI by 2030&rdquo;</td><td>Agentic AI spending across all software markets, 62.7% CAGR 2025&ndash;30</td><td>Gartner research abstract, 17 Feb 2026</td><td>{MED}</td></tr>
<tr><td>&ldquo;$1.3T agentic AI spending by 2029&rdquo;</td><td>Total AI spending (31.9% CAGR), with agentic AI as the main driver</td><td>IDC press release, 26 Aug 2025</td><td>{MED}</td></tr>
<tr><td>&ldquo;$155B agentic AI by 2030&rdquo;</td><td>Top-down TAM: agents handle 10% of knowledge-work workflows; vendors capture 8% of $1.9T of value</td><td>Bank of America Global Research, Jun 2025 (via Fortune)</td><td>{MED}</td></tr>
<tr><td>&ldquo;Agents will be 60% of software&rdquo;</td><td>Agents above 60% of a $780B application-software market in 2030, implying more than $468B; may refer to profit pool rather than revenue</td><td>Goldman Sachs Research, Jul 2025</td><td>{DER}</td></tr>
</table></div>
</div>

<div class="tai-padx">
<h2>Adoption: how many organisations actually use agents</h2>
<div class="tai-tablewrap"><table class="tai-table">
<tr><th>Measure</th><th>Figure</th><th>Source</th><th>Confidence</th></tr>
<tr><td>Organisations that have deployed AI agents</td><td>17%; over 60% expect to within two years</td><td>Gartner Hype Cycle for Agentic AI, 2026</td><td>{MED}</td></tr>
<tr><td>Organisations scaling an agentic AI system somewhere</td><td>23% scaling, 39% experimenting; no more than 10% scaling in any single function (n=1,993)</td><td>McKinsey, State of AI in 2025, Nov 2025</td><td>{MED}</td></tr>
<tr><td>Large firms (over $1B revenue) scaling AI agents</td><td>40%, up from 27%; smaller firms flat at 22% (n=1,719)</td><td>McKinsey, State of AI in 2026, Aug 2026</td><td>{MED}</td></tr>
<tr><td>Organisations that have fully scaled agentic AI</td><td>2%</td><td>Capgemini, Jul 2025</td><td>{MED}</td></tr>
<tr><td>Enterprise apps with task-specific agents by end-2026 (forecast)</td><td>Up to 40%, from under 5% in 2025</td><td>Gartner, 26 Aug 2025 &mdash; <a href="/reports/ai-predictions-scoreboard/">on our predictions scoreboard</a></td><td>{MED}</td></tr>
<tr><td>Agentic AI projects cancelled by end-2027 (forecast)</td><td>Over 40%, citing cost, unclear value and weak risk controls</td><td>Gartner, 25 Jun 2025</td><td>{MED}</td></tr>
</table></div>
</div>

<div class="tai-padx">
<h2>What vendors disclose</h2>
<p>Vendor disclosures are the closest thing to measured revenue, but none reports a clean &ldquo;agents&rdquo; line that matches any forecast's definition.</p>
<div class="tai-tablewrap"><table class="tai-table">
<tr><th>Vendor</th><th>Disclosure</th><th>Date</th><th>Confidence</th></tr>
<tr><td>Salesforce</td><td>Agentforce annual recurring revenue over $1.5B (+240% year on year). Redefined that quarter to include Slackbot and Headless 360, so not comparable with earlier quarters</td><td>26 Aug 2026</td><td>{MED}</td></tr>
<tr><td>ServiceNow</td><td>2026 AI annual contract value target raised to over $1.7B (from $1B); AI net new ACV up about 65%</td><td>28 Oct 2026</td><td>{MED}</td></tr>
<tr><td>Microsoft</td><td>Over 30 million paid Microsoft 365 Copilot seats (July 2026); no new seat total in October</td><td>Jul&ndash;Oct 2026</td><td>{MED}</td></tr>
<tr><td>Anthropic</td><td>Run-rate revenue over $30B in April 2026. Company-wide, not agent-specific</td><td>Apr 2026</td><td>{MED}</td></tr>
</table></div>
</div>

<div class="tai-padx">
<h2>How to quote this market</h2>
<p>If you need one sentence: <em>&ldquo;Research firms estimate standalone AI-agent revenue at about $7&ndash;8 billion in 2025, and their 2030 forecasts have a median of about $49 billion, with most between $36 billion and $54 billion (Report AI comparison of 20 forecasts, November 2026).&rdquo;</em></p>
<p>If you quote a single firm, give its name, the market as it defines it, and the year of the edition. If you quote Gartner's $206.5 billion or $985 billion, or IDC's $1.3 trillion, say what they measure. More widely repeated figures that do not survive checking are in our <a href="/reports/ai-statistics-fact-check/">AI statistics fact-check register</a>.</p>
</div>

<div class="tai-padx" style="background:#f5f5f7;">
<h2>Definitions</h2>
<p><strong><a href="/glossary/ai-agent/">AI agent</a>:</strong> software built on an AI model that plans and takes multi-step actions toward a goal, using tools, rather than answering a single prompt. <strong>Agentic AI:</strong> AI systems that act with some autonomy; used by research firms as a market label with no shared definition. <strong><a href="/glossary/multiagent-system/">Multiagent system</a>:</strong> several specialised agents coordinating on one task. <strong>CAGR:</strong> compound annual growth rate, the constant yearly growth that links a start and end value. <strong>TAM:</strong> total addressable market, an estimate of potential rather than measured revenue.</p>
</div>

<div class="tai-padx">
<h2>Frequently asked</h2>
{faq_html}
</div>

<div class="tai-padx" style="padding:28px 36px;">
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9aa2;margin-bottom:10px;">Methodology &amp; sources</div>
<p style="font-size:13.5px;line-height:1.6;color:#6e6e76;">Forecasts were collected in November 2026 from publishers' press releases, report pages and research abstracts, and from secondary reporting where those were not available; the &ldquo;Seen via&rdquo; column records which. Full reports are paywalled and publisher pages could not be opened in full from our research environment, so every figure is rated MEDIUM. Only current editions are compared; superseded editions are listed separately. <strong>DERIVED</strong> 2030 values convert each forecast to 2030 using its own stated CAGR, assuming constant growth (value&#8202;<sub>2030</sub> = forecast &divide; (1 + CAGR)<sup>years after 2030</sup>); where no CAGR is stated, the implied rate between base and forecast is used. The median and middle half are calculated across the 20 general-market forecasts, excluding enterprise-only figures. Market labels are given as each publisher uses them. Cadence: quarterly. See our <a href="/about/editorial-standards/">editorial standards</a> and <a href="/about/corrections/">corrections log</a>.</p>
</div>

<div class="tai-padx" style="padding:28px 36px;border-bottom:none;">
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9aa2;margin-bottom:10px;">Related on Report AI</div>
<p style="font-size:14px;margin:0;"><a href="/indexes/enterprise-ai/transformation-as-a-service-ai-workflows-2026/">AI-native workflows &amp; agent spending</a> &middot; <a href="/indexes/enterprise-ai/enterprise-ai-statistics-2026/">Enterprise AI statistics</a> &middot; <a href="/indexes/ai-economics/ai-prediction-forecasts-2026-2030/">AI market forecast 2026&ndash;2030</a> &middot; <a href="/indexes/ai-economics/llm-market-statistics-2026/">LLM market report</a> &middot; <a href="/indexes/ai-economics/ai-bubble-tracker/">AI bubble tracker</a> &middot; <a href="/reports/ai-predictions-scoreboard/">AI predictions, scored</a> &middot; <a href="/reports/ai-statistics-fact-check/">AI statistics that are wrong</a> &middot; <a href="/glossary/ai-agent/">What is an AI agent?</a></p>
</div>

</div>
<!-- /wp:html -->'''
ld={"@context":"https://schema.org","@graph":[
 {"@type":"Article","headline":"How Big Is the AI Agents Market, Really?","description":"30 published AI agents market forecasts from 24 firms, side by side: standalone agent revenue of about $7–8 billion in 2025 and a 2030 median of about $49 billion, and what the larger figures measure.","url":URL,"mainEntityOfPage":URL,"datePublished":"2026-11-09","dateModified":"2026-11-09","author":{"@type":"Organization","name":"Report AI","url":"https://report-ai.org"},"publisher":{"@id":"https://report-ai.org/#organization"},"about":["AI agents","agentic AI","market size","market forecasts","Gartner","IDC"]},
 {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]},
 {"@type":"Dataset","name":"AI agents market forecasts compared (data)","description":"Published AI agents and agentic AI market-size forecasts from research firms, consultancies and banks, with base and forecast values, CAGR, publication date, and a 2030 value converted at each forecast's own growth rate.","url":URL,"creator":{"@type":"Organization","name":"Report AI","url":"https://report-ai.org"},"publisher":{"@id":"https://report-ai.org/#organization"},"isAccessibleForFree":True,"dateModified":"2026-11-09","temporalCoverage":"2024/2035","distribution":[{"@type":"DataDownload","encodingFormat":"text/csv","contentUrl":CSV}]}]}
box=f'<div id="download-data" style="margin:20px 0 28px;padding:14px 18px;border:1px solid #e6e6ea;border-left:3px solid #2545f5;border-radius:8px;background:#fafafb;font-size:14.5px;line-height:1.55;color:#33333a;"><div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;font-weight:600;margin-bottom:4px;">Download the data</div><a href="/wp-content/uploads/2026/11/report-ai-data-ai-agents-market-size.csv" download style="color:#2545f5;font-weight:600;">Every forecast on this page as CSV</a> &middot; one row per forecast, with base, forecast, CAGR, our 2030 conversion and source type. Please cite <em>Report AI</em> and link to this page. <a href="/about/editorial-standards/">How we source and rate figures</a>.</div>'
H=H.replace('<p style="margin-top:14px;font-size:14px;color:#55555e;">Superseded', box+'\n<p style="margin-top:14px;font-size:14px;color:#55555e;">Superseded',1)
H+='\n<!-- wp:html -->\n<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False,separators=(',',':'))+'</script>\n<!-- /wp:html -->'
open('agents.html','w').write(H)
# CSV
import csv
with open('report-ai-data-ai-agents-market-size.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['page_url','page_updated','publisher','market_as_named','base_year','base_value_usd_bn','forecast_year','forecast_value_usd_bn','cagr_pct','value_2030_usd_bn','value_2030_basis','published','seen_via','confidence'])
    for r in F:
        v,d=v2030(r); pub,name,by,bv,fy,fv,c,cfy,cfv,date,seen=r
        w.writerow([URL,'2026-11-09',pub,name,by or '',bv or '',fy,fv,c or '',round(v,1),'DERIVED' if d else 'stated',date,seen,'MEDIUM'])
import re
txt=re.sub(r'<[^>]+>',' ',re.sub(r'<style.*?</style>|<script.*?</script>','',H,flags=re.S)); print('words',len(txt.split()), 'bytes',len(H))
