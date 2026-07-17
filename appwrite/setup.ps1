#!/usr/bin/env pwsh
# One-time Appwrite Cloud setup for Work Tracker.
# Idempotent: skips resources that already exist.
#
# Usage:
#   appwrite login
#   appwrite client --project-id work-tracker    # use the right project
#   pwsh ./appwrite/setup.ps1
#
# Or pass --org-id to override the default organisation.

param(
  [string]$OrgId = "64f1a3894de388392658",
  [string]$ProjectId = "work-tracker",
  [string]$DatabaseId = "work-tracker"
)

$ErrorActionPreference = "Stop"

function Run-Appwrite {
  param([string[]]$Args)
  $output = & appwrite @Args 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ appwrite $($Args -join ' ')" -ForegroundColor Red
    Write-Host $output
    throw "appwrite command failed"
  }
  return $output
}

Write-Host "→ Setting project: $ProjectId" -ForegroundColor Cyan
Run-Appwrite @("client", "--project-id", $ProjectId)

# --- Database ---
Write-Host "→ Ensuring database '$DatabaseId'" -ForegroundColor Cyan
$db = Run-Appwrite @("tables-db", "get", "--database-id", $DatabaseId)
if ($LASTEXITCODE -ne 0 -or $db -match "could not be found") {
  Run-Appwrite @("tables-db", "create", "--database-id", $DatabaseId, "--name", "Work Tracker")
}

function Ensure-Table {
  param(
    [string]$TableId,
    [string]$Name
  )
  $existing = Run-Appwrite @("tables-db", "get-table", "--database-id", $DatabaseId, "--table-id", $TableId) 2>&1
  if ($existing -match "could not be found") {
    Write-Host "  + creating table $TableId" -ForegroundColor Green
    Run-Appwrite @("tables-db", "create-table", "--database-id", $DatabaseId, "--table-id", $TableId, "--name", $Name, "--row-security", "true") | Out-Null
  } else {
    Write-Host "  = table $TableId exists" -ForegroundColor DarkGray
  }
}

function Ensure-StringColumn {
  param(
    [string]$TableId,
    [string]$Key,
    [int]$Size,
    [bool]$Required = $true
  )
  $req = $Required.ToString().ToLower()
  $cols = Run-Appwrite @("tables-db", "list-columns", "--database-id", $DatabaseId, "--table-id", $TableId, "--json")
  if ($cols -match "\"key\":\s*\"$Key\"") {
    return
  }
  Write-Host "    + column $Key" -ForegroundColor Green
  Run-Appwrite @("tables-db", "create-string-column", "--database-id", $DatabaseId, "--table-id", $TableId, "--key", $Key, "--size", "$Size", "--required", $req) | Out-Null
}

function Ensure-BooleanColumn {
  param([string]$TableId, [string]$Key, [bool]$Required = $true)
  $req = $Required.ToString().ToLower()
  $cols = Run-Appwrite @("tables-db", "list-columns", "--database-id", $DatabaseId, "--table-id", $TableId, "--json")
  if ($cols -match "\"key\":\s*\"$Key\"") { return }
  Write-Host "    + column $Key" -ForegroundColor Green
  Run-Appwrite @("tables-db", "create-boolean-column", "--database-id", $DatabaseId, "--table-id", $TableId, "--key", $Key, "--required", $req) | Out-Null
}

function Ensure-IntegerColumn {
  param([string]$TableId, [string]$Key, [bool]$Required = $true)
  $req = $Required.ToString().ToLower()
  $cols = Run-Appwrite @("tables-db", "list-columns", "--database-id", $DatabaseId, "--table-id", $TableId, "--json")
  if ($cols -match "\"key\":\s*\"$Key\"") { return }
  Write-Host "    + column $Key" -ForegroundColor Green
  Run-Appwrite @("tables-db", "create-integer-column", "--database-id", $DatabaseId, "--table-id", $TableId, "--key", $Key, "--required", $req) | Out-Null
}

function Ensure-FloatColumn {
  param([string]$TableId, [string]$Key, [bool]$Required = $true)
  $req = $Required.ToString().ToLower()
  $cols = Run-Appwrite @("tables-db", "list-columns", "--database-id", $DatabaseId, "--table-id", $TableId, "--json")
  if ($cols -match "\"key\":\s*\"$Key\"") { return }
  Write-Host "    + column $Key" -ForegroundColor Green
  Run-Appwrite @("tables-db", "create-float-column", "--database-id", $DatabaseId, "--table-id", $TableId, "--key", $Key, "--required", $req) | Out-Null
}

function Ensure-DatetimeColumn {
  param([string]$TableId, [string]$Key, [bool]$Required = $true)
  $req = $Required.ToString().ToLower()
  $cols = Run-Appwrite @("tables-db", "list-columns", "--database-id", $DatabaseId, "--table-id", $TableId, "--json")
  if ($cols -match "\"key\":\s*\"$Key\"") { return }
  Write-Host "    + column $Key" -ForegroundColor Green
  Run-Appwrite @("tables-db", "create-datetime-column", "--database-id", $DatabaseId, "--table-id", $TableId, "--key", $Key, "--required", $req) | Out-Null
}

function Ensure-Index {
  param([string]$TableId, [string]$Key, [string]$Type, [string[]]$Columns, [string[]]$Orders = @())
  $idxs = Run-Appwrite @("tables-db", "list-indexes", "--database-id", $DatabaseId, "--table-id", $TableId, "--json")
  if ($idxs -match "\"key\":\s*\"$Key\"") { return }
  Write-Host "    + index $Key" -ForegroundColor Green
  $args = @("tables-db", "create-index", "--database-id", $DatabaseId, "--table-id", $TableId, "--key", $Key, "--type", $Type)
  foreach ($c in $Columns) { $args += @("--columns", $c) }
  foreach ($o in $Orders) { $args += @("--orders", $o) }
  Run-Appwrite $args | Out-Null
}

# --- projects ---
Write-Host "→ projects" -ForegroundColor Cyan
Ensure-Table "projects" "Projects"
Ensure-StringColumn "projects" "userId" 36
Ensure-StringColumn "projects" "name" 128
Ensure-StringColumn "projects" "path" 512
Ensure-StringColumn "projects" "color" 16
Ensure-BooleanColumn "projects" "isHidden"
Ensure-BooleanColumn "projects" "isArchived"
Ensure-Index "projects" "idx_user" "key" @("userId")
Ensure-Index "projects" "idx_user_name" "unique" @("userId", "name")

# --- heartbeats ---
Write-Host "→ heartbeats" -ForegroundColor Cyan
Ensure-Table "heartbeats" "Heartbeats"
Ensure-StringColumn "heartbeats" "userId" 36
Ensure-StringColumn "heartbeats" "projectId" 36
Ensure-StringColumn "heartbeats" "projectName" 128
Ensure-StringColumn "heartbeats" "entity" 512
Ensure-StringColumn "heartbeats" "language" 64
Ensure-StringColumn "heartbeats" "branch" 128 $false
Ensure-StringColumn "heartbeats" "category" 32
Ensure-DatetimeColumn "heartbeats" "timestamp"
Ensure-FloatColumn "heartbeats" "durationSeconds"
Ensure-BooleanColumn "heartbeats" "isWrite"
Ensure-IntegerColumn "heartbeats" "linesAdded"
Ensure-IntegerColumn "heartbeats" "linesRemoved"
Ensure-StringColumn "heartbeats" "machineId" 64
Ensure-StringColumn "heartbeats" "editor" 64
Ensure-Index "heartbeats" "idx_user" "key" @("userId")
Ensure-Index "heartbeats" "idx_project" "key" @("projectId")
Ensure-Index "heartbeats" "idx_timestamp" "key" @("timestamp") @("DESC")
Ensure-Index "heartbeats" "idx_user_timestamp" "key" @("userId", "timestamp") @("ASC", "DESC")

# --- daily_summaries ---
Write-Host "→ daily_summaries" -ForegroundColor Cyan
Ensure-Table "daily_summaries" "Daily Summaries"
Ensure-StringColumn "daily_summaries" "userId" 36
Ensure-StringColumn "daily_summaries" "date" 10
Ensure-StringColumn "daily_summaries" "projectId" 36
Ensure-StringColumn "daily_summaries" "projectName" 128
Ensure-StringColumn "daily_summaries" "language" 64
Ensure-FloatColumn "daily_summaries" "totalSeconds"
Ensure-IntegerColumn "daily_summaries" "linesAdded"
Ensure-IntegerColumn "daily_summaries" "linesRemoved"
Ensure-IntegerColumn "daily_summaries" "sessions"
Ensure-Index "daily_summaries" "idx_user_date" "key" @("userId", "date") @("ASC", "DESC")
Ensure-Index "daily_summaries" "idx_user" "key" @("userId")
Ensure-Index "daily_summaries" "idx_date" "key" @("date")

# --- goals ---
Write-Host "→ goals" -ForegroundColor Cyan
Ensure-Table "goals" "Goals"
Ensure-StringColumn "goals" "userId" 36
Ensure-StringColumn "goals" "title" 128
Ensure-StringColumn "goals" "delta" 8
Ensure-IntegerColumn "goals" "seconds"
Ensure-StringColumn "goals" "languages" 512 $false
Ensure-StringColumn "goals" "projects" 512 $false
Ensure-BooleanColumn "goals" "isEnabled"
Ensure-DatetimeColumn "goals" "createdAt"
Ensure-Index "goals" "idx_user" "key" @("userId")

# --- Auth ---
Write-Host "→ auth: enabling email/password" -ForegroundColor Cyan
Run-Appwrite @("project", "update-auth-method", "--method-id", "email-password", "--enabled", "true") | Out-Null

Write-Host ""
Write-Host "✅ Appwrite setup complete" -ForegroundColor Green
Write-Host "   Project ID:  $ProjectId"
Write-Host "   Database ID: $DatabaseId"
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "   1. Set workTracker.appwriteProjectId in VS Code to: $ProjectId"
Write-Host "   2. Run 'Work Tracker: Sign In' to create your account."
