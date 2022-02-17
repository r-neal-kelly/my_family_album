<?php

// ex: password.php "hash" "my_password" "13"
// ex: password.php "verify" "my_password" "HASH_STR"
// WARNING: this implementation of bcrypt will truncate passwords to 72 letters!

$method = $argv[1];
$password = $argv[2];

if ($method == "hash") {
    $cost = (int)$argv[3];
    echo password_hash($password, PASSWORD_BCRYPT, [ "cost" => $cost ]);
} else if ($method == "verify") {
    $hash = $argv[3];
    echo password_verify($password, $hash) ? "true" : "false";
}
