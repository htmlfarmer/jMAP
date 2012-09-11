<?php

if ($_SERVER['REQUEST_METHOD'] == 'POST') { // POST REQUEST (not tested?)
  if(isset($_POST['uri'])){
    $uri=$_POST["uri"];
  } else {
    $uri = "";
  }
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET') { // GET REQUEST
  if(isset($_GET['uri'])){
    $uri=$_GET["uri"];
  } else {
    $uri = "";
  }
} else {
  $uri = "";
}
  $uri = str_replace(" ", "%20", $uri);
  $content = file_get_contents($uri);
  echo $content;
  
?>