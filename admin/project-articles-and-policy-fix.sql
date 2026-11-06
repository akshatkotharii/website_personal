-- Project article and engagement repair. Safe to rerun; preserves likes and comments.
-- Inserts or refreshes the six repo-backed stories in public.posts so likes,
-- comments, admin editing, and thread lookups share one stable post ID.
-- Also removes stale permissive policies that expose pending comments or
-- allow direct writes that should use the site's guarded RPC/admin flows.

begin;

-- Each skill can choose a presentation that fits its actual workflow.
alter table public.notebook_entries
  add column if not exists scene_type text not null default 'evidence-trail';
alter table public.notebook_entries drop constraint if exists notebook_entries_scene_type_check;
alter table public.notebook_entries
  add constraint notebook_entries_scene_type_check
  check (scene_type in ('evidence-trail','performance-lab','workflow-map','field-guide'));

insert into public.posts (title, slug, category, excerpt, content, created_at)
values
  ('Five days in Singapore, with my sister', 'five-days-in-singapore', 'travel', 'Five days of small discoveries: café stops, Universal, the city at night, and more shopping bags than planned.', '<p class="travel-kicker">Singapore · July 2026 · five days</p><p class="travel-intro">A five-day Singapore trip with my sister: cafés, Universal Studios, long walks, city lights and—predictably—far more shopping than either of us planned.</p><p>Singapore felt built for wandering without a plan. One minute we were finding colour in old shophouses, the next cooling off inside a café, taking the MRT somewhere new, or adding another bag to the hotel-room pile.</p><div class="travel-gallery"><figure class="travel-shot wide"><img src="../images/travel/singapore-2026/01-flight.webp" srcset="../images/travel/singapore-2026/01-flight-480.webp 480w, ../images/travel/singapore-2026/01-flight-800.webp 800w, ../images/travel/singapore-2026/01-flight.webp 1600w" sizes="(max-width: 500px) calc(100vw - 40px), (max-width: 800px) calc(100vw - 48px), 760px" width="1600" height="2133" decoding="async" alt="Flight from Mumbai to Singapore" loading="eager" fetchpriority="high"><figcaption>First frame: Mumbai to Singapore.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/02-collectible.webp" srcset="../images/travel/singapore-2026/02-collectible-480.webp 480w, ../images/travel/singapore-2026/02-collectible-800.webp 800w, ../images/travel/singapore-2026/02-collectible.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="1755" decoding="async" alt="A collectible Coca-Cola can on a café table" loading="lazy"><figcaption>Small finds along the way.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/03-haji-lane.webp" srcset="../images/travel/singapore-2026/03-haji-lane-480.webp 480w, ../images/travel/singapore-2026/03-haji-lane-800.webp 800w, ../images/travel/singapore-2026/03-haji-lane.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Colourful Haji Lane in Singapore" loading="lazy"><figcaption>Haji Lane, full of colour.</figcaption></figure><figure class="travel-shot wide"><img src="../images/travel/singapore-2026/04-universal.webp" srcset="../images/travel/singapore-2026/04-universal-480.webp 480w, ../images/travel/singapore-2026/04-universal-800.webp 800w, ../images/travel/singapore-2026/04-universal.webp 1600w" sizes="(max-width: 500px) calc(100vw - 40px), (max-width: 800px) calc(100vw - 48px), 760px" width="1600" height="2133" decoding="async" alt="Popcorn truck at Universal Studios Singapore" loading="lazy"><figcaption>Universal Studios, exactly as extra as it should be.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/05-ice-cream.webp" srcset="../images/travel/singapore-2026/05-ice-cream-480.webp 480w, ../images/travel/singapore-2026/05-ice-cream-800.webp 800w, ../images/travel/singapore-2026/05-ice-cream.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2845" decoding="async" alt="Colourful ice cream shop ceiling in Singapore" loading="lazy"><figcaption>A very good ice-cream stop.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/06-shophouses.webp" srcset="../images/travel/singapore-2026/06-shophouses-480.webp 480w, ../images/travel/singapore-2026/06-shophouses-800.webp 800w, ../images/travel/singapore-2026/06-shophouses.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Pastel shophouses in Singapore" loading="lazy"><figcaption>Pastel streets and blue skies.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/07-street-side.webp" srcset="../images/travel/singapore-2026/07-street-side-480.webp 480w, ../images/travel/singapore-2026/07-street-side-800.webp 800w, ../images/travel/singapore-2026/07-street-side.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Street vendor in Singapore" loading="lazy"><figcaption>Everyday street scenes.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/08-piano.webp" srcset="../images/travel/singapore-2026/08-piano-480.webp 480w, ../images/travel/singapore-2026/08-piano-800.webp 800w, ../images/travel/singapore-2026/08-piano.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Piano at Gardens by the Bay MRT station" loading="lazy"><figcaption>A quiet MRT-station piano moment.</figcaption></figure><figure class="travel-shot wide"><img src="../images/travel/singapore-2026/09-gardens.webp" srcset="../images/travel/singapore-2026/09-gardens-480.webp 480w, ../images/travel/singapore-2026/09-gardens-800.webp 800w, ../images/travel/singapore-2026/09-gardens.webp 1600w" sizes="(max-width: 500px) calc(100vw - 40px), (max-width: 800px) calc(100vw - 48px), 760px" width="1600" height="2133" decoding="async" alt="Supertrees at Gardens by the Bay at night" loading="lazy"><figcaption>Gardens by the Bay after dark.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/10-night-pizza.webp" srcset="../images/travel/singapore-2026/10-night-pizza-480.webp 480w, ../images/travel/singapore-2026/10-night-pizza-800.webp 800w, ../images/travel/singapore-2026/10-night-pizza.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Pizza bar at night in Singapore" loading="lazy"><figcaption>Late-night food, bright blue lights.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/11-cafe.webp" srcset="../images/travel/singapore-2026/11-cafe-480.webp 480w, ../images/travel/singapore-2026/11-cafe-800.webp 800w, ../images/travel/singapore-2026/11-cafe.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Café interior in Singapore" loading="lazy"><figcaption>One of many good café breaks.</figcaption></figure><figure class="travel-shot wide"><img src="../images/travel/singapore-2026/12-jewel.webp" srcset="../images/travel/singapore-2026/12-jewel-480.webp 480w, ../images/travel/singapore-2026/12-jewel-800.webp 800w, ../images/travel/singapore-2026/12-jewel.webp 1600w" sizes="(max-width: 500px) calc(100vw - 40px), (max-width: 800px) calc(100vw - 48px), 760px" width="1600" height="2133" decoding="async" alt="Jewel Changi waterfall and greenery" loading="lazy"><figcaption>Jewel: airport, rainforest, waterfall.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/13-souvenirs.webp" srcset="../images/travel/singapore-2026/13-souvenirs-480.webp 480w, ../images/travel/singapore-2026/13-souvenirs-800.webp 800w, ../images/travel/singapore-2026/13-souvenirs.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2133" decoding="async" alt="Singapore souvenir store" loading="lazy"><figcaption>Last-minute souvenirs.</figcaption></figure><figure class="travel-shot"><img src="../images/travel/singapore-2026/14-shopping.webp" srcset="../images/travel/singapore-2026/14-shopping-480.webp 480w, ../images/travel/singapore-2026/14-shopping-800.webp 800w, ../images/travel/singapore-2026/14-shopping.webp 1600w" sizes="(max-width: 500px) calc((100vw - 48px) / 2), 370px" width="1600" height="2845" decoding="async" alt="Shopping bags in a Singapore hotel room" loading="lazy"><figcaption>Proof that shopping was part of itinerary.</figcaption></figure></div><h2>What I’m taking back</h2><p>Not a perfectly planned guide. More a collection of moments: a city that moves fast but leaves room for detours, good food and tiny surprises. Best part, though, was doing it all with my sister.</p>', '2026-07-23T10:00:00+08:00'),
  ('Aliasearch: research before reach-out', 'aliasearch-research-before-reachout', 'project', 'Aliasearch grew from a real customer-research task and one concern: a name is not a reason to reach out. The tool checks identity, buying role, offer fit and contact evidence before a person decides.', '<section class="alias-hero"><p class="alias-overline">A project note · customer research</p><h2 class="alias-name">Aliasearch</h2><p class="alias-hero-copy">A research skill that checks whether a potential customer fits a real offer, shows the evidence, and leaves the decision to a person.</p><a class="alias-github" href="https://github.com/akshatkotharii/aliasearch" target="_blank" rel="noopener noreferrer">See the project on GitHub ↗</a></section>

<p class="alias-statement">A name in a list is a starting point, not a reason to reach out.</p>
<p>I built Aliasearch after seeing how easy it is for outreach research to become a search for volume. A directory gives you names. A quick web search gives you snippets. A large spreadsheet can look persuasive. None of those things alone tells you whether a company is real, whether it buys or resells the relevant product, or whether your offer fits its work.</p>
<p>The first practical task was to find plausible wholesale fabric buyers for a Mumbai textile manufacturer and exporter. The brief was specific, but the early research showed how quickly a candidate can look promising for the wrong reason. A company may work in textiles without buying this product. A directory may be out of date. A public profile may identify a person without showing that they handle purchasing.</p>
<p>That gap between finding a name and being able to defend why it belongs on a shortlist became the product problem. I wanted a repeatable process that makes the reasoning visible, including the places where evidence is thin.</p>

<h2>Research first, message later</h2>
<p>Aliasearch is a reusable skill for an AI assistant, not an autonomous sales agent. It starts with a brief: the actual offer, who might buy it, the relevant market, exclusions, the evidence standard and the number of strong matches requested. If those details are vague, the research should pause for clarification instead of quietly filling in assumptions.</p>
<div class="alias-flow">
  <article class="alias-step"><span class="alias-step-number">01 / FRAME</span><h3>Define the offer.</h3><p>Clarify buyer, market, exclusions and what counts as evidence.</p></article>
  <article class="alias-step"><span class="alias-step-number">02 / DISCOVER</span><h3>Find candidates.</h3><p>Use relevant company sites, directories and public sources.</p></article>
  <article class="alias-step"><span class="alias-step-number">03 / VERIFY</span><h3>Check each claim.</h3><p>Deduplicate and record where identity, fit and contact details came from.</p></article>
  <article class="alias-step"><span class="alias-step-number">04 / REVIEW</span><h3>Return a decision.</h3><p>Show evidence and gaps so a person can choose what happens next.</p></article>
</div>

<h2>Four questions before a prospect qualifies</h2>
<p>A search result can help discover a company. Qualification asks for more. I use four checks to keep the decision grounded in the offer rather than a broad industry label.</p>
<section class="alias-gates"><h2>Qualification checks</h2><div class="alias-gate"><strong>Identity</strong><span>Is this a real organisation in the market described by the brief?</span></div><div class="alias-gate"><strong>Buying role</strong><span>Is there evidence it buys, imports, stocks or resells through a relevant business route?</span></div><div class="alias-gate"><strong>Offer fit</strong><span>Does its product range or use connect to this specific offer?</span></div><div class="alias-gate"><strong>Contact route</strong><span>Is there a credible public business contact path, with its source recorded?</span></div></section>
<p>These checks also make uncertainty useful. A candidate might pass identity but lack evidence of buying role. Another might fit the product but have no verified contact route. Those are different situations, and hiding both behind one green “qualified” label would make the result less trustworthy.</p>

<h2>Evidence should travel with the recommendation</h2>
<p>Reviews of the first research work found weak role evidence, uncertain product matches, stale or conflicting pages, and incomplete contact details. The issue was not that the search had found nothing. It was that the list did not always show which claims could be relied on.</p>
<p>Aliasearch keeps candidates separate from verified companies, preserves source context, and records the reason behind a decision. A result should make it possible to ask: what did we observe, where did that information come from, how recent is it, and what remains unknown?</p>
<p>That approach changes how I think about requested counts. If a brief asks for twenty strong prospects and only seven meet the bar, I would rather return seven with clear reasons than pad the list with weak matches. The number is part of the request, but it cannot make unsupported evidence stronger.</p>

<div class="alias-boundary"><strong>A person stays in charge.</strong><p>Aliasearch helps research and prepare a reviewable shortlist. It does not send messages, guarantee complete coverage or claim that a prospect will respond. A person decides whether the evidence is sufficient and whether contact makes sense.</p></div>

<h2>What I want the tool to become</h2>
<p>I want Aliasearch to make careful research easier to repeat, not to automate away judgement. A useful next version should help a researcher move from an offer to a defensible list without burying the reasons inside a long report. The evidence should be compact enough to review and detailed enough to challenge.</p>
<p>It is still early. I need to learn where the qualification gates miss good prospects, where sources create false confidence, and how to keep the workflow focused when the brief itself is unclear. Better research may produce fewer names. That can be a better result if each one has a real reason to be there.</p>
<p>If you do customer research or sell to other businesses, I would value hearing where this process would help and where it would slow you down.</p>
', '2026-11-04T10:00:00+05:30'),
  ('Building a place for clean-energy research to move', 'building-a-place-for-clean-energy-research', 'research', 'Why I joined Plaksha Clean Energy Forum’s founding team, what the forum is trying to build between research and real projects, and why I want more students to find a way into clean-energy work.', '<section class="cef-hero">
  <div class="cef-brand"><img src="../images/blog/cef-logo-green.png" width="720" height="720" alt="Clean Energy Forum logo" decoding="async"><span><strong>Plaksha Clean Energy Forum</strong><small>Research · community · collaboration</small></span></div>
  <p class="cef-overline">A field note from the founding team</p>
  <h2 class="cef-title">Building a place for clean-energy questions to move.</h2>
  <p class="cef-lede">I joined because I want more students to find serious energy questions, meet people working on them and have a practical way to contribute.</p>
  <a class="cef-link" href="https://cleanenergyforum.in/" target="_blank" rel="noopener noreferrer">Explore the current forum ↗</a>
</section>

<p>Clean energy feels like one of the defining areas to build in. For India, the questions are immediate: how to meet growing demand, make energy more reliable and affordable, build resilience, and develop the knowledge and capability to shape what comes next. I believe research and development deserve more attention, and more people should have a path into that work.</p>
<p>That is why I joined the founding team of Plaksha Clean Energy Forum (CEF), powered by the Indorama Ventures Center for Clean Energy (IVCCE). I serve as Research and Entrepreneurship Head. The role sits between a question, a project and what the work might become. I want to help make energy problems clear enough to investigate, and help notice where a useful idea could lead to a pilot, partnership or deeper research.</p>
<p>My own work at IVCCE has made this feel practical. A technical system can be carefully designed and still struggle when it meets real routines, deployment constraints or missing evidence. I want more students to get close to that process, where the question is not only “can we build it?” but also “who will use it, what would make it trustworthy, and what would count as learning?”</p>

<h2>Why a forum, rather than another list of opportunities?</h2>
<p>Students often have curiosity before they have a project. They may care about energy but not know which questions are researchable, who to speak with, or what a first contribution could look like. A list of events or links can help someone discover a field. It does not necessarily help them move from interest to work.</p>
<p>I hope CEF can become a place where that transition is easier. The forum can connect research questions with student effort, faculty and mentors, people in industry, and communities facing practical challenges. The relationships matter as much as the project page. A good project needs a clear scope, a way to test its assumptions and someone who can help it keep moving.</p>

<h2>The path we are trying to build</h2>
<div class="cef-steps" aria-label="The forum''s working path from questions to shared learning">
  <div class="cef-step"><b>01 / LISTEN</b><strong>Find a real question</strong><span>Notice challenges emerging from research, industry and communities.</span></div>
  <div class="cef-step"><b>02 / SHAPE</b><strong>Make it workable</strong><span>Clarify what is known, what is uncertain and what can be tested.</span></div>
  <div class="cef-step"><b>03 / CONNECT</b><strong>Bring people together</strong><span>Help students find relevant collaborators and mentors.</span></div>
  <div class="cef-step"><b>04 / DO</b><strong>Support the work</strong><span>Keep projects moving through check-ins and useful documentation.</span></div>
  <div class="cef-step"><b>05 / SHARE</b><strong>Let learning travel</strong><span>Record what changed and what a next team can build on.</span></div>
</div>
<p>This is a working direction, not a claim that every stage is already in place. The public site now gives people routes into research, events, dispatches, the community, mentors, leadership and a join form. That form asks what someone can contribute, why the problem matters to them and how much time they can commit. I like that it asks for a realistic commitment as well as enthusiasm.</p>
<p>The forum is still early. Some projects are beginning to roll out, and the work ahead is to learn from those first efforts. We need to understand whether project scopes are clear, whether students can make a meaningful contribution and whether collaborators have the support they need. A website can make an invitation visible; the quality of the work has to earn people''s trust.</p>

<h2>Where research and entrepreneurship meet</h2>
<p>For me, research means helping identify worthwhile questions and making them specific enough to investigate. Entrepreneurship means noticing when an idea could have a useful life beyond one project: perhaps as an application, a pilot, a partnership or a venture. Neither should rush past the evidence. A promising possibility still needs to meet real constraints.</p>
<p>That balance is important in clean energy. A prototype can work under one set of conditions and still be difficult to deploy elsewhere. A student project can produce an interesting result without being ready for a real-world use. The forum should help people communicate those differences clearly, so each project can find the right next step rather than being pushed toward a premature success story.</p>

<div class="cef-belief"><small>What I believe</small><strong>India needs more careful clean-energy research, and more ways for students to join that work early.</strong></div>

<h2>What I hope we learn by building it</h2>
<p>I do not want to write about CEF as if we have already built the community I imagine. We are at the start. The next work is to support the first projects, meet the people who join, keep the structure light enough to change, and document what we learn from doing the work.</p>
<p>I hope a student can arrive with a question, find people who help sharpen it, and leave with a clearer sense of what they want to investigate next. I hope researchers and industry collaborators can find students ready to work on meaningful problems. And I hope the forum becomes useful because of the projects and relationships it supports, not because of how ambitious its description sounds.</p>
<p>This is close to my heart because clean energy is not only a technology field. It is a long-term set of questions about how we live, build and make choices. I want to help create more room for students, mentors, researchers and industry to work on those questions together.</p>
<p><a href="https://cleanenergyforum.in/" target="_blank" rel="noopener noreferrer">Visit cleanenergyforum.in ↗</a> · <a href="post.html?slug=smart-energy-nudging">Read about my IVCCE research ↗</a></p>
', '2026-11-04T10:00:00+05:30'),
  ('The handoff problem behind my outreach tool', 'outreach-brain', 'project', 'A small event team was managing around 600 contacts. I built a shared workflow to keep ownership, conversations and next steps connected without forcing every team to abandon spreadsheets.', '<section class="story-hero nudgen-hero">
  <p class="story-kicker">A product story · outreach</p>
  <h2 class="story-title">The next person should not have to start over.</h2>
  <p class="story-lede">For one college event, two or three of us were coordinating around 600 contacts. The spreadsheet held the list. It could not reliably hold the whole conversation.</p>
  <a class="story-link" href="https://outreach-brain.aliass.workers.dev/" target="_blank" rel="noopener noreferrer">Open the live workspace ↗</a>
</section>

<p>Excel was a sensible place to begin. We could collect names, sort colleges, prepare messages and share a working list. The trouble started after someone made contact. Calls happened on personal phones, messages sat in different places, and context moved between teammates in quick conversations.</p>
<p>A row marked “contacted” left too much unanswered. Who spoke with the person? What did they ask for? Was there a registration link to send? Should someone call next week, or leave them alone? When the owner changed, the next teammate could inherit a name without inheriting the conversation.</p>
<p>I first thought we needed a more organised spreadsheet. Then I realised the real problem was the handoff. The next person needed enough context to continue with care, without asking the contact to explain everything again.</p>

<h2>Make the next action visible</h2>
<p>That became the centre of Outreach Brain: import the list a team already has, assign responsibility, record what happened, and make the next step explicit. A contact should not sit in a vague “done” state when the real work is still unfolding.</p>
<div class="nudgen-workflow" aria-label="The shared outreach loop">
  <div class="nudgen-step"><b>01 / BRING IN</b><strong>Import the list</strong></div>
  <div class="nudgen-step"><b>02 / OWN</b><strong>Assign a teammate</strong></div>
  <div class="nudgen-step"><b>03 / REMEMBER</b><strong>Record the outcome</strong></div>
  <div class="nudgen-step"><b>04 / CONTINUE</b><strong>Set the next action</strong></div>
</div>
<p>The first version supports Excel import, checks for duplicate and incomplete records, and connects contacts with events and registrations. A teammate can record a call or message outcome, keep a note, assign a follow-up and set a reminder. The point is not to make every interaction elaborate. It is to give a team a shared memory for the details that change what should happen next.</p>
<p>That shared record matters most when work crosses people. One person may make the first call, another may answer a question about an event, and someone else may need to confirm a registration. If each person sees the relevant history and their own next task, the team has a better chance of continuing the relationship instead of restarting it.</p>

<h2>Different people need different views</h2>
<p>As the tool took shape, I had to think about who should see and change what. An admin needs to manage the workspace and team access. Members need to work with contacts and follow-ups. Someone checking overall progress may need a read-only dashboard, without access to every person''s contact details.</p>
<div class="story-flow" aria-label="Roles in the outreach workspace">
  <div class="story-flow-card"><b>ADMIN</b><strong>Set up the team</strong><span>Manage workspace access and shared settings.</span></div>
  <div class="story-flow-card"><b>MEMBER</b><strong>Continue the work</strong><span>Handle contacts, conversations and reminders.</span></div>
  <div class="story-flow-card"><b>DASHBOARD</b><strong>Review progress</strong><span>See selected totals without contact-level access.</span></div>
  <div class="story-flow-card"><b>TEAM</b><strong>Keep records portable</strong><span>Export data instead of locking it into one tool.</span></div>
</div>
<p>That is why permissions and exports belong in the product from the start. A team should be able to limit access by role and still take its records elsewhere. Import matters because people already have work in spreadsheets. Export matters because they should remain in control of it.</p>

<h2>Keep the useful parts of a spreadsheet</h2>
<p>I do not think every team needs to move every list into a new system. For one person or a small, short-lived list, Excel may be the clearest tool. It is flexible, familiar and easy to inspect. A shared workspace becomes more useful when several people need the same history, ownership and follow-up rhythm.</p>
<p>Import and export let those tools work together. That decision also keeps the product honest about its job: coordinate the conversations that need coordination, rather than replacing a format people already know how to use.</p>
<p>Two outreach teams tried versions of the tool, and I asked people with user-interface experience to challenge the workflow. Their feedback made me reconsider what belonged on screen. Every extra status, field or button asks a teammate to learn and maintain one more thing. I keep coming back to a simple question: does this detail help someone make a better next move?</p>

<details class="story-details"><summary>What still needs care</summary><div><p>The current WhatsApp connection uses an unofficial bridge intended for controlled testing. Delivery labels are provider-reported signals, not proof that a person read or acted on a message. Message sending has its own permissions. Those boundaries matter before a team relies on the tool more widely.</p></div></details>

<p>The live application presents itself as Nudgen. I still think of the problem as Outreach Brain: how can a small team handle a large contact list without turning people into rows or losing the thread between conversations?</p>
<p>I built the first version to solve a problem I faced. The more useful test now is whether another team can use it without me standing beside them to explain every step. I want to learn where it saves effort, where it adds friction, and which parts should stay in a spreadsheet.</p>
', '2026-11-04T10:20:00+05:30'),
  ('SpinSync: making shared laundry easier to plan', 'spinsync-shared-laundry', 'project', 'Our 70-response survey revealed the cost of guessing about shared machines. Here is how SpinSync grew from a booking idea into a pilot plan, and what still needs to be tested.', '<section class="story-hero spin-hero">
  <p class="story-kicker">SpinSync · a shared-laundry project</p>
  <h2 class="story-title">A free machine should not be a guessing game.</h2>
  <p class="story-lede">We kept making the same trip to the hostel laundry room, only to find every machine occupied. SpinSync began as an attempt to make that small daily system easier to see, share and trust.</p>
  <div class="spin-scene"><div class="spin-washer" aria-hidden="true"><div class="spin-drum"></div></div><div class="spin-scene-copy">A useful status view should help someone decide whether to go, wait or join the next turn.</div></div>
</section>

<p>SpinSync took shape during a two-semester Innovation Lab and Grand Challenge project at Plaksha University in Mohali. Our six-person team was asked to work on a real problem. I led solution design, and the first answer seemed obvious: build an app where students could book a washing machine.</p>
<p>But a booking only tells us what someone planned to do. It does not tell the next student whether a machine is actually running, whether a cycle has finished, or whether anyone has collected the clothes. We needed to understand the room before deciding what software belonged in it.</p>

<h2>Start with the routine, not the feature list</h2>
<p>We surveyed residents from 16 to 21 April 2026 and received 70 submissions. Students described several linked frustrations: finding a machine already occupied, walking over just to check, waiting for clothes to be removed, and trying to work out whose turn came next.</p>
<div class="spin-stats" aria-label="Selected findings from 70 survey submissions">
  <div class="spin-stat"><strong>80%</strong><span>56 of 70 said clothes were left in machines after cycles.</span></div>
  <div class="spin-stat"><strong>73%</strong><span>51 of 70 found machines occupied when they wanted one.</span></div>
  <div class="spin-stat"><strong>87%</strong><span>61 of 70 physically checked whether a machine was free.</span></div>
  <div class="spin-stat"><strong>46</strong><span>of 70 reported waits of 30 minutes or more in the named survey categories.</span></div>
</div>
<p>These answers helped us locate the friction. They do not prove that a booking app, reminder or sensor will solve it. The sample also has a clear limit: 62 of the 70 responses came from H2 boys hostel. We should not present it as a campus-wide estimate. A fresh study needs more balanced participation and consistent information about hostel and machine access.</p>
<p>That caveat changed how I thought about “validation.” The survey was useful because it gave us a better next question, not because it approved every feature we had imagined.</p>

<h2>A booking app grew into a shared service</h2>
<p>We began sketching a system around the whole laundry cycle: see a machine’s status, reserve a turn or join a queue, receive a reminder when a cycle is near its end, and report a fault. An admin view could help someone review machine issues and exceptions. The aim is to make the next step visible to the people sharing the room.</p>
<div class="spin-system" aria-label="The four parts of the SpinSync concept">
  <span>See machine status</span><span>Book or join queue</span><span>Get a cycle reminder</span><span>Report a problem</span>
</div>
<p>We also explored smart sockets as a way to estimate when a machine starts or stops drawing power. That signal could help update a status, but it cannot tell whether clothes have been removed. Different cycles and faults can also produce patterns that are hard to interpret. Any pilot needs to compare socket readings with what is actually happening at the machine, and provide a manual fallback for hardware or network problems.</p>

<h2>Fairness needs human judgement</h2>
<p>The difficult cases are not edge cases for the people involved. Someone may be delayed for a genuine reason. A machine may fail. A sensor may report the wrong state. If the system turns those uncertainties straight into penalties, it could make the room feel less fair instead of more organised.</p>
<div class="story-callout"><strong>Design principle:</strong> use clear reminders, reasonable pickup buffers, a way to report problems, and human review for disputed events. Let the system make coordination easier without pretending it knows more than its evidence supports.</div>
<p>This is why we treated accountability as a design question, not a punishment feature. The software should help people see what happened and resolve a problem, while leaving room for context that a machine cannot observe.</p>

<h2>What a small pilot should tell us</h2>
<p>The course project is complete, and I am continuing SpinSync independently. Before building a larger system, I want to refresh the survey, speak with hostel residents and decision-makers, and validate the smart-socket signal on a limited number of machines.</p>
<p>A controlled pilot should give us evidence about practical questions: do people check availability before walking over? Are machine states accurate enough to rely on? Do reminders help clothes get collected sooner? Do queues feel understandable and fair? What happens when a machine or connection fails? We would need to agree on those measures before deciding whether the system deserves to grow.</p>
<p>There is no public demo yet. SpinSync has not been shown to reduce waiting, disputes or pickup delays in a live hostel. That is the point of the next step: find out what works in the room, not just what looks convincing in a prototype.</p>
<p>I still like the original idea because it is ordinary. Shared laundry is a small system, but it brings together people, machines, timing and trust. Designing for the messy moments between those parts has been more useful than starting with an app screen and assuming the rest will take care of itself.</p>
', '2026-11-04T10:30:00+05:30'),
  ('Turning energy readings into a conversation people can use', 'smart-energy-nudging', 'research', 'At IVCCE, I am building a WhatsApp energy coach around smart-socket readings. I explain the research question, why I narrowed AI''s role, what the failed field installation taught me, and which evidence gates remain.', '<section class="story-hero energy-hero">
  <p class="story-kicker">Research in progress · IVCCE, Plaksha University</p>
  <h2 class="story-title">Can energy data become useful at the right moment?</h2>
  <p class="story-lede">I am building a WhatsApp energy coach around smart-socket readings. The research question is whether a clear explanation or optional suggestion can help people understand their appliance use. A message is not evidence of energy saved.</p>
</section>

<p>A smart socket can measure electricity use. A chart can show a pattern. But neither automatically answers the questions a person might have: what is this appliance doing, is this reading reliable, and is there anything I want to change?</p>
<p>That gap is why I joined this work at the Indorama Ventures Center for Clean Energy (IVCCE) at Plaksha University. The project combines software, energy data and behaviour research. I care about the technical system, but the real question is human: can information arrive in a form that helps someone make sense of it without taking control away from them?</p>
<p>I have learned to keep two possible outcomes separate. One is whether people understand and use the coach. The other is whether measured energy use changes. Engagement does not prove savings, and an energy difference would need careful analysis before we could explain why it happened.</p>

<h2>Designing the path from reading to response</h2>
<p>The system receives timestamped readings from a smart socket, checks the record for coverage and reliability, and calculates usage before preparing an explanation or an optional suggestion. Each step can fail in a different way. A device may be mapped incorrectly. Data may be missing. A pattern may look unusual without showing why it occurred.</p>
<div class="energy-route" aria-label="From appliance readings to a research question">
  <div class="energy-node"><b>01 / MEASURE</b><strong>Read the socket</strong><span>Timestamped power readings from a selected appliance.</span></div>
  <div class="energy-node"><b>02 / CHECK</b><strong>Test reliability</strong><span>Confirm access, device mapping and data coverage.</span></div>
  <div class="energy-node"><b>03 / EXPLAIN</b><strong>Use plain language</strong><span>Answer a question or offer an optional suggestion.</span></div>
  <div class="energy-node"><b>04 / EVALUATE</b><strong>Separate outcomes</strong><span>Study understanding and energy use independently.</span></div>
</div>

<h2>Give each part a job it can do well</h2>
<p>Early versions gave an AI model too much responsibility. It could interpret the data and shape an answer, which made the system feel flexible but also made the important decisions harder to reproduce. Energy calculations, access permissions and research eligibility should not depend on a model producing a plausible sentence.</p>
<p>So I moved those responsibilities into deterministic code. It checks which device a person is allowed to access, validates the readings, calculates energy in kilowatt-hours and decides whether a reminder is eligible. Models can help with language, such as interpreting an open-ended question or preparing a transcription. They do not grant access, calculate energy or decide that a household should receive a nudge.</p>
<div class="energy-layers" aria-label="System responsibilities">
  <div class="energy-layer"><b>Measured and checked</b><strong>Code owns the facts</strong><p>Authorised device scope, data quality checks, energy totals and eligibility rules. No guessed electricity cost when a verified tariff is not available.</p></div>
  <div class="energy-layer"><b>Flexible but bounded</b><strong>Models help with language</strong><p>Open questions and voice transcription can use language tools, behind the same access and calculation checks.</p></div>
</div>
<p>This division also helps when something goes wrong. If a daily total looks strange, we can inspect the readings and calculation. If an answer sounds wrong, we can review the language step without changing how energy was computed.</p>

<h2>WhatsApp is a choice of setting, not proof of impact</h2>
<p>The first prototype used Discord. It handled text, model replies and voice commands, but it did not match the setting we wanted to study. We moved the interaction to WhatsApp to test the coach in a more familiar kind of conversation. That is a design choice, not evidence that households prefer it. People can ask about current or past use, request a chart, send a voice note, set reminder preferences or choose quiet hours. They can pause, opt out or withdraw from research.</p>
<p>Those options matter because a helpful prompt for one person may feel intrusive to another. A reminder should be optional and controlled by the person receiving it. The system should also avoid turning a pattern into a diagnosis. A reading alone cannot prove that an appliance is broken or wasting energy.</p>

<h2>Privacy shapes what the system keeps</h2>
<p>Collecting every conversation might seem useful for improving a coach, but it would also retain details the research does not need. The current design separates permission to operate the coach, permission to analyse research outcomes and any future permission to improve shared language resources.</p>
<div class="story-flow" aria-label="Research data boundaries">
  <div class="story-flow-card"><b>KEEP</b><strong>Study essentials</strong><span>Consent state, preferences, delivery labels and defined outcomes.</span></div>
  <div class="story-flow-card"><b>EXCLUDE</b><strong>Private conversations</strong><span>Raw message text, voice audio, names, phone numbers and credentials.</span></div>
  <div class="story-flow-card"><b>SEPARATE</b><strong>Personal from shared</strong><span>Future learning examples need consent, redaction and human review.</span></div>
  <div class="story-flow-card"><b>RESPECT</b><strong>Pause or leave</strong><span>People can change preferences or withdraw from the study.</span></div>
</div>
<p>I want those boundaries to be part of how the product works, not promises added after the system is built. The same is true of data quality: missing periods should be visible, not quietly filled in to make a chart look complete.</p>

<h2>Software checks are not household evidence</h2>
<p>The system has been exercised through automated tests and local dry-runs for calculations, permissions, preferences, charts, voice handling and message paths. Those checks help find software defects. They do not tell me whether households will use the coach, whether messages feel timely, or whether anyone changes an energy habit.</p>
<p>Our planned Mumbai installation targeted smart sockets on ten geysers. The installation attempt did not succeed. No participant, engagement or energy result came from it. That was a difficult but useful boundary: a technically functioning bot is not the same as research working in someone''s home.</p>
<p>Some household-facing details still need careful handling too. Earlier aggregate records were incomplete, so daily and monthly answers now need to be reconstructed from reliable minute-level readings. If a day does not meet the data-quality threshold, the system should say so rather than inventing a complete picture. The same rule applies to cost: without a verified tariff, the coach should not turn usage into a made-up bill estimate.</p>

<h2>The next steps are gates, not a launch date</h2>
<div class="energy-checkpoint" aria-label="Planned evidence gates before field intervention">
  <div><b>FIRST</b><strong>Install and calibrate</strong><span>Confirm hardware, appliance mapping, time settings and reliable readings.</span></div>
  <div><b>THEN</b><strong>Establish a baseline</strong><span>Collect consented data and exclude incomplete periods.</span></div>
  <div><b>AFTER REVIEW</b><strong>Consider a small study</strong><span>Agree on intervention rules, supervision and opt-out before starting.</span></div>
</div>
<p>The current roadmap proposes 21 reliable baseline days, followed by a 30-day silent observation period in which possible anomalies are reviewed without sending automated messages. A limited opt-out-capable intervention could follow only if installation, false-positive checks and supervision are acceptable. These are planning stages, not an approved or completed study protocol.</p>

<div class="story-callout"><strong>Where I am today:</strong> the software and research method are clearer. The project has not yet shown household adoption, energy savings or causal impact.</div>

<p>I keep returning to the difference between a useful signal and a useful intervention. A socket gives us a measurement. It does not give us permission, context or a reason to interrupt someone. The research has to connect those pieces carefully, and be honest when the evidence is not ready.</p>
', '2026-11-04T10:40:00+05:30')
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  excerpt = excluded.excerpt,
  content = excluded.content,
  created_at = excluded.created_at,
  updated_at = now();

-- Keep pending comments visible only to the portfolio admin.
drop policy if exists authenticated_read_all_comments on public.comments;
-- Remove legacy broad policies; admin writes remain guarded by owner_* policies.
drop policy if exists auth_insert_posts on public.posts;
drop policy if exists auth_update_posts on public.posts;
drop policy if exists auth_delete_posts on public.posts;
drop policy if exists auth_update_comments on public.comments;
drop policy if exists auth_delete_comments on public.comments;
drop policy if exists auth_all_settings on public.settings;
drop policy if exists auth_delete_subscribers on public.subscribers;
-- Restore explicit admin paths after removing legacy authenticated-user access.
drop policy if exists portfolio_admin_posts_write on public.posts;
create policy portfolio_admin_posts_write on public.posts for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists portfolio_admin_comments_write on public.comments;
create policy portfolio_admin_comments_write on public.comments for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists portfolio_admin_settings_access on public.settings;
create policy portfolio_admin_settings_access on public.settings for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists portfolio_admin_subscribers_access on public.subscribers;
create policy portfolio_admin_subscribers_access on public.subscribers for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
-- Like changes go through portfolio_set_like, which validates visitor tokens.
drop policy if exists public_read_likes on public.likes;
drop policy if exists public_insert_likes on public.likes;
drop policy if exists public_delete_likes on public.likes;
drop policy if exists portfolio_admin_likes_access on public.likes;
create policy portfolio_admin_likes_access on public.likes for all to authenticated
  using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

-- Reframe the existing Aliasearch notebook project as the growing skills cabinet.
update public.notebook_projects
set title = 'Skills & tools',
    kind = 'Building',
    status = 'building',
    summary = 'Small skills built from real problems and useful enough to share.',
    current = 'Turning useful workflows into a growing collection of focused skills. Aliasearch and AliasOpti are the first two.',
    thinking = 'Each skill solves its own problem and gets a presentation that fits how it works.',
    next_step = 'Keep building, documenting and sharing the next useful skill.',
    url = '',
    thread_url = '',
    icon = 'notebook',
    animation = 'draw',
    pinned = true,
    sort_order = 5,
    updated_at = now()
where id = 'c855b879-8b70-4d05-8be0-8e31af5c5968';

insert into public.notebook_entries (project_id, title, body, url, published, scene_type)
select 'c855b879-8b70-4d05-8be0-8e31af5c5968',
       'Aliasearch',
       'An open-source research skill for checking who a person or organization is, whether they fit an offer, and whether there is enough evidence to reach out. Built from a real customer-research workflow.',
       'https://github.com/akshatkotharii/aliasearch',
       true,
       'evidence-trail'
where exists (select 1 from public.notebook_projects where id = 'c855b879-8b70-4d05-8be0-8e31af5c5968')
  and not exists (
    select 1 from public.notebook_entries
    where project_id = 'c855b879-8b70-4d05-8be0-8e31af5c5968' and title = 'Aliasearch'
  );

update public.notebook_entries
set scene_type = 'evidence-trail'
where project_id = 'c855b879-8b70-4d05-8be0-8e31af5c5968' and title = 'Aliasearch';

insert into public.notebook_entries (project_id, title, body, url, published, scene_type)
select 'c855b879-8b70-4d05-8be0-8e31af5c5968',
       'AliasOpti',
       'A portable, measurement-first performance skill for AI coding agents. It establishes a baseline, investigates the biggest verified bottlenecks, guides focused fixes, then checks the result without confusing lab scores with real-user data.',
       'https://github.com/akshatkotharii/aliasopti',
       true,
       'performance-lab'
where exists (select 1 from public.notebook_projects where id = 'c855b879-8b70-4d05-8be0-8e31af5c5968')
  and not exists (
    select 1 from public.notebook_entries
    where project_id = 'c855b879-8b70-4d05-8be0-8e31af5c5968' and title = 'AliasOpti'
  );

commit;

select jsonb_pretty(jsonb_build_object(
  'article_rows', (
    select jsonb_agg(jsonb_build_object('slug',slug,'id',id,'content_chars',char_length(content)) order by slug)
    from public.posts
    where slug in (
      'five-days-in-singapore', 'aliasearch-research-before-reachout',
      'building-a-place-for-clean-energy-research', 'outreach-brain',
      'spinsync-shared-laundry', 'smart-energy-nudging'
    )
  ),
  'pending_comment_read_policy_removed', not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='comments' and policyname='authenticated_read_all_comments'
  ),
  'skills_project', (
    select jsonb_build_object('title',title,'id',id) from public.notebook_projects
    where id='c855b879-8b70-4d05-8be0-8e31af5c5968'
  ),
  'skills', (
    select jsonb_agg(jsonb_build_object('title',title,'scene_type',scene_type,'published',published) order by title)
    from public.notebook_entries where project_id='c855b879-8b70-4d05-8be0-8e31af5c5968'
  ),
  'aliasearch_skill_added', exists (
    select 1 from public.notebook_entries
    where project_id='c855b879-8b70-4d05-8be0-8e31af5c5968' and title='Aliasearch' and published
  ),
  'aliasopti_skill_added', exists (
    select 1 from public.notebook_entries
    where project_id='c855b879-8b70-4d05-8be0-8e31af5c5968' and title='AliasOpti' and published and scene_type='performance-lab'
  )
)) as verification;
