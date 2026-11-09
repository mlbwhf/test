import json, html
t=open('tpl-3233.html').read()
css=t[t.find('<style>'):t.find('</style>')+8]
css=css.replace('</style>','.tai-c{display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;padding:2px 6px;border-radius:2px;white-space:nowrap;}.tai-c-med{background:#fdf3e3;color:#9a6a00;}.tai-c-der{background:#eef1fd;color:#2545f5;}.tai-c-con{background:#fde8e8;color:#b42318;}\n.tai-sub{font-size:12px;color:#77777f;}\n</style>')
URL='https://report-ai.org/reports/ai-market-pulse/'
CSVURL='https://report-ai.org/wp-content/uploads/2026/11/report-ai-data-ai-market-pulse.csv'
M='<span class="tai-c tai-c-med">MEDIUM</span>'; M1='<span class="tai-c tai-c-med">MEDIUM</span> <span class="tai-sub">single source</span>'
D='<span class="tai-c tai-c-der">DERIVED</span>'; C='<span class="tai-c tai-c-con">CONTESTED</span>'
def table(head, rows):
    h='<div class="tai-tablewrap"><table class="tai-table">\n<tr>'+''.join(f'<th>{x}</th>' for x in head)+'</tr>\n'
    h+=''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>\n' for r in rows)
    return h+'</table></div>'
def sec(title, intro, body, extra='', bg=''):
    return f'\n<div class="tai-padx"{bg}>\n<h2>{title}</h2>\n'+(f'<p>{intro}</p>\n' if intro else '')+body+extra+'\n</div>\n'

capex=table(['Company','Q3 2026 capex','Prior quarter','Full-year guidance','Free cash flow','Confidence'],[
 ['<strong>Amazon</strong>','$75.9B, net of incentives','$53.1B cash / $54.2B gross (different basis)','~$220B cash capex for 2026, reaffirmed','&minus;$42.4B, trailing 12 months',M1],
 ['<strong>Alphabet</strong>','$51.4B (purchases of property and equipment)','$44.9B','$195&ndash;205B for 2026, unchanged','&asymp; &minus;$9.1B in Q3',M],
 ['<strong>Microsoft</strong>','$45.2B incl. finance leases (FY27 Q1, Jul&ndash;Sep); below its own &gt;$50B outlook','$41.0B','~$170B; reported as calendar 2026 by most outlets, fiscal 2027 by one','&mdash;',C],
 ['<strong>Meta</strong>','$34.91B incl. finance-lease principal (vs $19.37B a year earlier)','~$31B','$135&ndash;145B for 2026, narrowed from $130&ndash;145B','&minus;$2.12B in Q3',M],
 ['<strong>Four combined</strong>','<strong>&asymp; $207B</strong> as each company reports it','','','',D],
])
fin=table(['Deal','Amount','Date','Confidence'],[
 ['Meta equity raise: Class A common stock with forwards plus mandatory convertible preferred, and a planned at-the-market programme of up to $60B from Q1 2027','~$35B launched','26 Oct 2026',M],
 ['Meta five-part US dollar bond, maturities 2031&ndash;2056, coupons 5.85%&ndash;7.50%','$15B','Completed 5 Nov 2026',M],
 ['Oracle common stock (~$9.9B net) and senior notes in six tranches, coupons 7.000%&ndash;8.650%','$20B','Priced 2 Nov, closed 4 Nov 2026',M],
 ['Alphabet euro bond','&euro;6B','Early Nov 2026',M1],
 ['Volta debt for a Norway AI data centre, backed by a six-year, $10B compute contract with Anthropic; expected to price at 11% or more','$5B','Marketed from 13 Oct 2026',M],
 ['Schneider Electric to acquire PTC (industrial AI)','~$22.6B equity value','5 Oct 2026',M],
 ['Salesforce to acquire Braze (AI decisioning for Marketing Cloud)','$5.66B','20 Oct 2026',M],
 ['Anthropic files public S-1 for a Nasdaq listing; H1 2026 revenue $16.3B, Q2 operating profit $974M on $11.6B revenue (as reported)','&mdash;','26 Oct 2026',M],
])
rounds=table(['Company','Raised','Valuation','Lead / main backers','Date','Confidence'],[
 ['<strong>DeepSeek</strong>','About $15&ndash;16B (100&ndash;105.5B yuan)','About $86B post-money; reports range $74B pre to $90B','CATL, Tencent; Meituan, Geely and state investors also reported','Late Oct 2026',C],
 ['<strong>OpenAI</strong>','~$11B first close; round may reach $20B','$1.25T, below an earlier $1.4&ndash;1.5T ask','Reports differ','6 Nov 2026',M],
 ['Axiom Solutions International (AI cloud and power, Flex spin-off)','$2B convertible preferred','$37.5B enterprise value','General Catalyst, Koch Equity Development','Week of 3&ndash;9 Oct',M],
 ['Tenstorrent (AI chips)','$1.5B Series E','$6.2B','Trace Capital, Innovation X','19 Oct 2026',M],
 ['Flapping Airplanes (AI lab)','$1B Series A','$6B','Index Ventures, Lux Capital','21 Oct 2026',M],
 ['TypeSafe AI','~$870M Series A','$7.5B','Andreessen Horowitz','9 Oct 2026',M],
 ['Modal Labs (AI compute)','$750M Series D','$15.75B','Accel','14 Oct 2026',M],
 ['FuriosaAI (AI chips)','$620M Series D','~$2.9B','Korea National Growth Fund (largest investor)','~28 Oct 2026',M],
 ['Upwind','$400M Series C','$3.8B','Bessemer','Oct 2026',M1],
 ['Applied Compute','$350M','$3.25B','not found','Week of 31 Oct',M1],
])
prices=table(['Item','Price per million tokens','Date','Confidence'],[
 ['Silicon Data LLM Token Expenditure Index (usage-weighted market price)','Below $1, about 54% under its late-May peak of $2.07; implied &asymp; $0.95','22 Oct 2026 (Axios)',M1+' '+D],
 ['Anthropic Claude Haiku 5.5 (new)','$0.10 input / $0.50 output for prompts up to 100K tokens; Haiku 4.5 was $1 / $5','7 Oct 2026',M],
 ['OpenAI GPT-6.1 Terra (new)','$1 input / $5 output, half the price of GPT-6.1 Sol','26 Oct 2026',M],
 ['Google Gemini 4 Argon','$2 / $10 introductory until 30 Nov 2026, then $4 / $20: a scheduled price rise','Generally available 13 Oct 2026',M],
 ['DeepSeek V4.1-Flash','$0.15 / $0.60 off-peak, $0.30 / $1.20 peak; no list-price change found','Oct 2026',M1],
])
users=table(['Assistant','Figure','Measure','Date','Confidence'],[
 ['ChatGPT','1.2 billion','Weekly active users, from an executive interview, not a release','Reported 3 Nov 2026; one source dates it to 29 Sep',C],
 ['Gemini app','More than 1 billion (from 950M in July)','Monthly active users','28 Oct 2026, Alphabet Q3 call',M],
 ['Doubao','419.08 million','Monthly active users (QuestMobile, third-party panel)','Q3 2026',M1],
 ['DeepSeek','122.65 million','Monthly active users (QuestMobile, September)','Q3 2026',M1],
 ['Meta AI','No total disclosed; Muse agent 10M+ accounts in the US and Canada','Accounts','21 Oct 2026',M],
 ['Microsoft Copilot','No absolute figure; daily users up ~50% quarter on quarter; paid M365 Copilot seats not updated (30M+ in July)','Relative only','28 Oct 2026',M],
])
jobs=table(['Measure','Figure','Report','Confidence'],[
 ['US job cuts announced, October 2026','43,994 (down 71% from 153,074 in October 2025)','Challenger, Gray &amp; Christmas, 5 Nov 2026',M],
 ['Cuts attributed to AI, October 2026','1,265, the lowest month of 2026','Challenger, 5 Nov 2026',M],
 ['Cuts attributed to AI, September 2026','3,961 (fifth-ranked reason that month)','Challenger, 1 Oct 2026',M],
 ['Cuts attributed to AI, January&ndash;October 2026','121,401, against 54,836 in all of 2025','Challenger, 5 Nov 2026',M],
 ['Top reason year to date','&ldquo;Market/economic conditions&rdquo; (130,531) has overtaken AI','Challenger, 5 Nov 2026',M],
 ['All announced cuts, January&ndash;October 2026','617,189, down 44% year on year','Challenger, 5 Nov 2026',M],
])
models=table(['Model','Company','Date','Headline claim','Confidence'],[
 ['Claude Haiku 5.5','Anthropic','7 Oct 2026','1M-token context; up to 90% cheaper than Haiku 4.5',M],
 ['Gemini 4 Argon (general availability)','Google','13 Oct 2026','Google says it leads 12&ndash;13 of 18 benchmarks; vendor-run evaluations',M],
 ['Muse Spark Open','Meta','15 Oct 2026','816B-parameter open-weight model (42B active); trails Kimi K3 on coding',M],
 ['GPT-6.1 Terra','OpenAI','26 Oct 2026','Half the API price of GPT-6.1 Sol',M],
 ['Mistral Large 4 (open weights)','Mistral','29 Oct 2026','~1T-parameter mixture-of-experts, modified-MIT licence',M],
])
reg=table(['Date','Where','What happened','Confidence'],[
 ['1 Oct 2026','US: Connecticut','CART Act takes effect: whistleblower protection at frontier developers, content authentication for large generative-AI providers, AI disclosure in layoff notices',M],
 ['~30 Sep&ndash;1 Oct 2026','US: California','Governor signs the &ldquo;No Robo Bosses Act&rdquo; and about a dozen other AI bills',M],
 ['10 Oct 2026','China','Cyberspace Administration guidelines for deploying large AI models in government work',M1],
 ['12 Oct 2026','UK','Frontier-AI risk package: AI incident reporting under the Cyber Security and Resilience Bill, extended cyber pilots',M],
 ['Status','EU','No new omnibus action in the window. Two new Article 5 prohibitions, including &ldquo;nudifier&rdquo; apps, apply from 2 December 2026; stand-alone high-risk duties move to 2 December 2027',M],
 ['Status','US federal','No federal pre-emption statute; the House &ldquo;Great American AI Act&rdquo; remains a discussion draft',M],
])
watch='''<ul style="font-size:15px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:0;">
<li style="margin-bottom:6px;"><strong>Anthropic's listing.</strong> The S-1 was filed publicly on 26 October; a debut has been reported as expected before Thanksgiving.</li>
<li style="margin-bottom:6px;"><strong>30 November:</strong> Gemini 4 Argon's introductory price ends and doubles to $4 / $20 per million tokens.</li>
<li style="margin-bottom:6px;"><strong>2 December:</strong> the EU AI Act's new Article 5 prohibitions apply, including the ban on &ldquo;nudifier&rdquo; apps.</li>
<li style="margin-bottom:6px;"><strong>Early December:</strong> Challenger's November job-cuts report, which will show whether October's low AI-attributed count was a one-month dip.</li>
<li style="margin-bottom:0;"><strong>31 December:</strong> Gartner's forecast that up to 40% of enterprise applications will include task-specific agents resolves; we score it in January on our <a href="/reports/ai-predictions-scoreboard/">predictions scoreboard</a>.</li>
</ul>'''
FAQ=[
("How much did big tech spend on AI infrastructure in Q3 2026?","Amazon, Alphabet, Microsoft and Meta reported combined capital expenditure of about $207 billion for the quarter ending September 2026, as each company reports it: Amazon $75.9 billion, Alphabet $51.4 billion, Microsoft $45.2 billion and Meta $34.91 billion. The bases differ slightly (net of incentives, including finance leases), so the total is a Report AI sum, not a like-for-like figure."),
("Is AI still the top reason for US layoffs in 2026?","Not any more. Challenger, Gray & Christmas counted 121,401 US job cuts attributed to AI from January to October 2026, more than twice the 54,836 for all of 2025, but 'market/economic conditions' (130,531) overtook AI as the leading reason year to date in its 5 November 2026 report. AI-attributed cuts fell to 1,265 in October, the lowest month of the year."),
("How much does it cost to use AI models in November 2026?","The usage-weighted market price measured by Silicon Data's LLM Token Expenditure Index fell below $1 per million tokens in October 2026, about 54% under its late-May peak. Frontier list prices are much higher: OpenAI's GPT-6.1 Terra costs $1 input and $5 output per million tokens, and Google's Gemini 4 Argon rises to $4 and $20 after 30 November 2026."),
("How many people use ChatGPT and Gemini?","Google said on 28 October 2026 that the Gemini app has more than 1 billion monthly active users. An OpenAI executive said in an interview reported on 3 November 2026 that ChatGPT has 1.2 billion weekly active users; the figure has not appeared in an official release and one source dates it to late September."),
("What were the biggest AI funding rounds in October 2026?","DeepSeek raised about $15–16 billion at a reported valuation of about $86 billion, and OpenAI closed a first tranche of about $11 billion at a $1.25 trillion valuation on 6 November 2026. Crunchbase counted $59 billion of global venture funding in October 2026, 66% of it going to AI companies."),
]
faq_html=''.join(f'<p style="font-size:15px;margin:0 0 6px;"><strong>{q}</strong></p><p style="font-size:14.5px;color:#55555e;margin:0 0 18px;">{html.escape(a,quote=False)}</p>' for q,a in FAQ)
NOBR=' style="border-right:none;"'
tile=lambda big,txt,chip,last=False: f'<div class="tai-stat"{NOBR if last else ""}><div style="font-weight:900;font-size:34px;letter-spacing:-0.03em;color:#2545f5;">{big}</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">{txt} {chip}</div></div>'
box='<div id="download-data" style="margin:20px 0 28px;padding:14px 18px;border:1px solid #e6e6ea;border-left:3px solid #2545f5;border-radius:8px;background:#fafafb;font-size:14.5px;line-height:1.55;color:#33333a;"><div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;font-weight:600;margin-bottom:4px;">Download the data</div><a href="/wp-content/uploads/2026/11/report-ai-data-ai-market-pulse.csv" download style="color:#2545f5;font-weight:600;">All 8 tables in this edition as CSV</a> &middot; one row per table cell, with the same sources, dates and confidence ratings shown here. Please cite <em>Report AI</em> and link to this page. <a href="/about/editorial-standards/">How we source and rate figures</a>.</div>'
H=f'''<!-- wp:html -->
{css}
<div class="tai-wrap">

<div class="tai-padx" style="padding:48px 36px 36px;">
<div class="tai-mono" style="font-size:11px;color:#9a9aa2;margin-bottom:16px;"><a href="/" style="color:#9a9aa2;text-decoration:none;">Home</a> <span style="color:#d3d3da;">/</span> <a href="/reports/" style="color:#9a9aa2;text-decoration:none;">Reports</a> <span style="color:#d3d3da;">/</span> <span style="color:#111114;">AI Market Pulse</span></div>
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;margin-bottom:12px;">Monthly &middot; Edition 1 &middot; November 2026</div>
<h1 style="font-weight:900;font-size:clamp(34px,6vw,52px);line-height:1.0;letter-spacing:-0.03em;margin:0 0 16px;">AI Market Pulse: November 2026</h1>
<p style="font-size:18px;color:#55555e;margin:0 0 14px;">The month in AI numbers, checked: what the biggest companies spent and borrowed, who raised money, what AI costs, how many people use it, and what it did to jobs. Covers 1 October to 8 November 2026.</p>
<div class="tai-mono" style="font-size:12px;color:#9a9aa2;">By the Report AI editorial team &middot; Published <time datetime="2026-11-09">9 November 2026</time> &middot; Cadence: monthly &middot; Next edition early December 2026</div>
</div>

<div class="tai-statgrid" style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #e6e6ea;">
{tile("&asymp;$207B","combined Q3 2026 capex of Amazon, Alphabet, Microsoft and Meta, as each reports it",D)}
{tile("$70B+","new equity and debt raised by Meta, Oracle and Alphabet between 26 Oct and 5 Nov 2026",D)}
{tile("66%","share of October 2026's $59B in global venture funding that went to AI companies (Crunchbase)",M)}
{tile("1,265","US job cuts attributed to AI in October 2026, the lowest month of the year (Challenger)",M,True)}
</div>

<div class="tai-padx" style="background:#f5f5f7;">
<div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">Analysis</div>
<h2 style="font-size:30px;">The AI build-out started borrowing in earnest</h2>
<p>The biggest number this month is not a funding round. Amazon, Alphabet, Microsoft and Meta reported about $207 billion of capital expenditure for the July&ndash;September quarter, as each company reports it, and for three of them spending ran ahead of the cash their businesses generated: Meta's free cash flow was negative $2.1 billion for the quarter, Alphabet's about negative $9.1 billion, and Amazon's negative $42.4 billion over twelve months. None of the three cut its guidance: Meta narrowed its 2026 range to $135&ndash;145 billion, Alphabet held $195&ndash;205 billion and Amazon reaffirmed about $220 billion, and Alphabet and Amazon both said spending will rise again in 2027.</p>
<p>What changed is how the gap is being paid for. Between 26 October and 5 November, Meta launched about $35 billion of new equity and sold $15 billion of bonds, Oracle raised $20 billion in stock and notes at coupons up to 8.65%, and Alphabet sold a &euro;6 billion bond: more than $70 billion of outside capital between them. Further down the stack, a $5 billion debt package for a Norwegian data centre backed by an Anthropic compute contract is being marketed at 11% or more. AI infrastructure is no longer funded mainly from operating cash flow, and the price of that capital is now visible.</p>
<p>Prices for using AI kept falling at the bottom and edged up at the top. A usage-weighted index of what the market pays per million tokens fell below $1, while new small models launched at a tenth of their predecessors' prices. Google, by contrast, will double Gemini 4 Argon's price to $4 and $20 per million tokens when its introductory period ends on 30 November. Cheap capability is getting cheaper; the frontier is being priced as scarce.</p>
<p>On jobs, the headline reversed. US job cuts attributed to AI reached 121,401 for January to October, more than twice the 2025 total, but only 1,265 of them came in October, the lowest month of the year, and AI is no longer the leading stated reason for cuts in 2026. One month is not a trend; November's report will show whether this is a pause or a turn. Our <a href="/reports/ai-replacement-reversal-2026/">AI replacement reversal report</a> tracks the companies rehiring after AI cuts.</p>
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77777f;margin:26px 0 10px;">Key takeaways</div>
<ul style="font-size:15.5px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:0;">
<li style="margin-bottom:8px;"><strong>Capex outran cash.</strong> About $207 billion in one quarter from four companies, with free cash flow negative at Meta, Alphabet and Amazon.</li>
<li style="margin-bottom:8px;"><strong>Capital markets filled the gap.</strong> More than $70 billion of new equity and debt from Meta, Oracle and Alphabet in under two weeks.</li>
<li style="margin-bottom:8px;"><strong>Two-speed pricing.</strong> The market average fell below $1 per million tokens while Google scheduled a frontier price rise.</li>
<li style="margin-bottom:0;"><strong>AI layoffs slowed sharply in October</strong>, to 1,265 attributed cuts, though the 2026 total is still more than double 2025's.</li>
</ul>
</div>
{sec("Big tech capex, Q3 2026","Quarterly capital expenditure as each company reports it. Bases differ: Amazon reports net of incentives, Microsoft and Meta include finance leases. Treat the combined figure as an order of magnitude, not a like-for-like total.",capex)}
{sec("Financing and deals","New equity, debt and acquisitions of $1 billion or more announced in the window.",fin)}
{sec("The largest AI funding rounds","Crunchbase counted $59 billion of global venture funding in October 2026, up 45% year on year; 66% went to AI-driven companies, and seven billion-dollar rounds made up just over 40% of the total.",rounds)}
{sec("What AI costs","Price per million tokens. Input and output prices are given where the provider publishes both. For the full price series see the <a href='/indexes/ai-economics/llm-token-price-index/'>LLM token price index</a>.",prices)}
{sec("How many people use AI assistants","Weekly and monthly figures are not interchangeable; we label each. Why published user numbers disagree is set out in <a href='/reports/ai-user-numbers-us-china-compared/'>AI user numbers, US vs China</a>.",users)}
{sec("AI and jobs","US announced job cuts, from Challenger, Gray &amp; Christmas. Attribution to AI is the employer's stated reason, which can overstate or understate AI's actual role.",jobs)}
{sec("Models released","The five most significant releases in the window. Benchmark claims are the vendors' own.",models)}
{sec("Regulation","",reg)}
{sec("What to watch in December","",watch)}
<div class="tai-padx">
{box}
</div>

<div class="tai-padx">
<h2>Frequently asked</h2>
{faq_html}
</div>

<div class="tai-padx" style="padding:28px 36px;">
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9aa2;margin-bottom:10px;">Methodology &amp; sources</div>
<p style="font-size:13.5px;line-height:1.6;color:#6e6e76;">This edition covers events and disclosures from 1 October to 8 November 2026. Figures were compiled from company results and releases as reported by Reuters, Bloomberg, CNBC, the Financial Times, Axios, TechCrunch and specialist outlets; company filings and press pages could not be opened directly from our research environment, so every figure is rated MEDIUM, and those resting on a single outlet are marked &ldquo;single source&rdquo;. <strong>CONTESTED</strong> marks figures where credible sources disagree; both versions are given. <strong>DERIVED</strong> figures are our arithmetic: the combined capex is the sum of the four companies' reported figures on their own bases; &ldquo;$70B+&rdquo; sums Meta's ~$35B equity and $15B bonds, Oracle's $20B and Alphabet's &euro;6B; the token index value of &asymp;$0.95 applies Axios's reported 54% decline to the $2.07 peak. Excluded as unverified: a reported $6B Anthropic acquisition of Decart AI, an OpenAI &ldquo;$20B&rdquo; round dated 1 October, and an Alphabet 2027 capex figure of &ldquo;over $300B&rdquo;, which is analyst speculation rather than guidance. Each month this page is replaced by the new edition, and earlier editions are kept in the archive. See our <a href="/about/editorial-standards/">editorial standards</a> and <a href="/about/corrections/">corrections log</a>.</p>
</div>

<div class="tai-padx" style="padding:28px 36px;border-bottom:none;">
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9aa2;margin-bottom:10px;">Related on Report AI</div>
<p style="font-size:14px;margin:0;"><a href="/reports/ai-agents-market-size/">How big is the AI agents market, really?</a> &middot; <a href="/indexes/ai-economics/llm-token-price-index/">LLM token price index</a> &middot; <a href="/indexes/ai-economics/ai-bubble-tracker/">AI bubble tracker</a> &middot; <a href="/indexes/ai-economics/ai-investment-funding-statistics-2026/">AI investment &amp; funding</a> &middot; <a href="/reports/ai-replacement-reversal-2026/">The AI replacement reversal</a> &middot; <a href="/reports/ai-user-numbers-us-china-compared/">AI user numbers, US vs China</a> &middot; <a href="/reports/ai-statistics-fact-check/">AI statistics that are wrong</a> &middot; <a href="/reports/ai-predictions-scoreboard/">AI predictions, scored</a></p>
</div>

</div>
<!-- /wp:html -->'''
ld={"@context":"https://schema.org","@graph":[
 {"@type":"Article","headline":"AI Market Pulse: November 2026","description":"The month in AI numbers, 1 October to 8 November 2026: about $207 billion of big-tech capex in Q3, more than $70 billion of new equity and debt, the largest AI funding rounds, token prices, assistant user numbers and AI-attributed job cuts.","url":URL,"mainEntityOfPage":URL,"datePublished":"2026-11-09","dateModified":"2026-11-09","author":{"@type":"Organization","name":"Report AI","url":"https://report-ai.org"},"publisher":{"@id":"https://report-ai.org/#organization"},"about":["AI market","AI capex","AI funding","AI pricing","AI jobs"]},
 {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]},
 {"@type":"Dataset","name":"AI Market Pulse, November 2026 (data)","description":"Every table in the November 2026 edition of Report AI's monthly AI Market Pulse: big-tech capex, financing and deals, funding rounds, token prices, assistant user numbers, AI-attributed job cuts, model releases and regulation, with source and confidence for each figure.","url":URL,"creator":{"@type":"Organization","name":"Report AI","url":"https://report-ai.org"},"publisher":{"@id":"https://report-ai.org/#organization"},"isAccessibleForFree":True,"dateModified":"2026-11-09","temporalCoverage":"2026-10-01/2026-11-08","distribution":[{"@type":"DataDownload","encodingFormat":"text/csv","contentUrl":CSVURL}]}]}
H+='\n<!-- wp:html -->\n<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False,separators=(',',':'))+'</script>\n<!-- /wp:html -->'
H=H.replace('\\"','"')
open('pulse.html','w').write(H)
import re
txt=re.sub(r'<[^>]+>',' ',re.sub(r'<style.*?</style>|<script.*?</script>','',H,flags=re.S)); print('words',len(txt.split()),'bytes',len(H))
import re as _re
H=_re.sub(r"href='([^']*)'",r'href="\1"',open('pulse.html').read()); open('pulse.html','w').write(H)
