if ($args.Count -ne 0) {
    Write-Host 'Usage: .\scripts\check.ps1 (no arguments)'
    exit 2
}
. "$PSScriptRoot/common.ps1"

try {
    Invoke-ProjectPnpm -CommandArguments @('--filter', 'studentmart-backend', 'run', 'db:check')
    exit 0
}
catch {
    Exit-ProjectScriptWithError $_
}
