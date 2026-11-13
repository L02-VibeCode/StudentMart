if ($args.Count -ne 0) {
    Write-Host 'Usage: .\scripts\up.ps1 (no arguments)'
    exit 2
}
. "$PSScriptRoot/common.ps1"

try {
    Invoke-ProjectPnpm -CommandArguments @('--filter', 'studentmart-backend', 'run', 'db:init')
    exit 0
}
catch {
    Exit-ProjectScriptWithError $_
}
