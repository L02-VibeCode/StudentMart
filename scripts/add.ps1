param(
    [ValidatePattern('^[A-Za-z][A-Za-z0-9_]*$')]
    [string]$Name = 'SchemaChange'
)

. "$PSScriptRoot/common.ps1"

try {
    Write-Host "Generating migration from entity changes: $Name"
    Invoke-ProjectPnpm -CommandArguments @(
        '--filter', 'studentmart-backend', 'run', 'migration:generate',
        "src/shared/database/migrations/$Name"
    )
    Write-Host 'Migration generated. Review its SQL before running up.ps1.'
    exit 0
}
catch {
    Write-Host 'If TypeORM reports no schema changes, no migration file is needed.'
    Exit-ProjectScriptWithError $_
}
