<?php
/**
 * assess/lead.php — capture one assessment lead. No account, no key, no fee.
 *
 * The assessment posts its JSON here. This appends a row to leads.csv beside
 * this file and emails a copy to the address in $NOTIFY. That is the whole job.
 *
 * It exists so the page can never collect an email and throw it away: it works
 * the moment you upload it, with nothing configured. HubSpot (see assess.js) is
 * the real destination; this is the safety net under it, and the record you
 * keep if HubSpot is ever misconfigured.
 *
 * SECURITY NOTES — read before editing:
 *  - $NOTIFY is hardcoded. Never take the recipient from the request, or this
 *    becomes an open mail relay and the domain's sending reputation is gone.
 *  - Nothing from the request reaches a mail header. Header injection is how a
 *    contact form becomes a spam gateway.
 *  - leads.csv holds personal data. The .htaccess written beside it blocks web
 *    access; if your host ignores .htaccess, move the file above the document
 *    root and set $STORE to that path.
 */

declare(strict_types=1);

$NOTIFY = 'info@agile-agilist.com';           // where the alert goes. Fixed on purpose.
$FROM   = 'no-reply@agile-agilist.com';       // must be on your own domain or it will be filtered
$STORE  = __DIR__ . '/leads.csv';             // move above the docroot if you can
$MAXLEN = 8000;                               // a real submission is ~400 bytes

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['ok' => false]);
    exit;
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '' || strlen($raw) > $MAXLEN) {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

$in = json_decode($raw, true);
if (!is_array($in)) {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

/* Never trust the browser. Re-validate the email here even though the page
   already did — the page is only a convenience for the person filling it in. */
$email = trim((string) ($in['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false]);
    exit;
}

$clean = static function ($v, int $max = 120): string {
    $v = is_scalar($v) ? (string) $v : '';
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v);   // strips CR/LF, so no header injection
    $v = trim((string) $v);
    return mb_substr($v, 0, $max);
};

$name    = $clean($in['name'] ?? '');
$wave    = $clean($in['wave'] ?? '', 8);
$weakest = $clean($in['weakest'] ?? '', 8);
$layers  = is_array($in['layers'] ?? null) ? $in['layers'] : [];

$scores = [];
foreach (['01', '02', '03', '04', '05'] as $k) {
    $scores[$k] = isset($layers[$k]) ? (int) $layers[$k] : 0;
}

$row = [
    gmdate('c'),
    $name,
    $email,
    $wave,
    $weakest,
    $scores['01'], $scores['02'], $scores['03'], $scores['04'], $scores['05'],
    $clean($in['utm_source'] ?? '', 80),
    $clean($in['utm_medium'] ?? '', 80),
    $clean($in['utm_campaign'] ?? '', 80),
    $clean($_SERVER['HTTP_REFERER'] ?? '', 200),
];

/* First run: create the file with a header, and block it from the web. */
$fresh = !file_exists($STORE);
$fh = @fopen($STORE, 'a');
if ($fh !== false) {
    if (flock($fh, LOCK_EX)) {
        if ($fresh) {
            fputcsv($fh, ['ts', 'name', 'email', 'wave', 'weakest',
                          'l01', 'l02', 'l03', 'l04', 'l05',
                          'utm_source', 'utm_medium', 'utm_campaign', 'referer']);
        }
        fputcsv($fh, $row);
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);

    $guard = __DIR__ . '/.htaccess';
    if (!file_exists($guard)) {
        @file_put_contents($guard, "<FilesMatch \"\\.csv$\">\n  Require all denied\n</FilesMatch>\n");
    }
}

$body = "New five-layer assessment reading\n\n"
      . "Name:    " . ($name !== '' ? $name : '(not given)') . "\n"
      . "Email:   $email\n"
      . "Wave:    $wave\n"
      . "Weakest: layer $weakest\n\n"
      . "01 Iterative delivery at scale  {$scores['01']}\n"
      . "02 Innovation in cadence        {$scores['02']}\n"
      . "03 AI-Native                    {$scores['03']}\n"
      . "04 AI automation                {$scores['04']}\n"
      . "05 Mutation                     {$scores['05']}\n\n"
      . "Source:  " . ($row[10] !== '' ? "{$row[10]} / {$row[11]} / {$row[12]}" : '(direct)') . "\n"
      . "Referer: " . ($row[13] !== '' ? $row[13] : '(none)') . "\n";

/* $FROM is a constant of this file, so the header cannot be poisoned. */
@mail($NOTIFY, 'Mutation assessment — ' . $email, $body,
      "From: Mutation <$FROM>\r\nContent-Type: text/plain; charset=utf-8\r\n");

echo json_encode(['ok' => true]);
