Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:ProjectRoot = Split-Path -Parent $PSScriptRoot

function Invoke-ProjectPnpm {
    param([Parameter(Mandatory = $true)][string[]]$CommandArguments)

    $pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    if (-not $pnpmCommand) {
        $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
    }
    if (-not $pnpmCommand) {
        throw 'pnpm was not found. Install pnpm 10.34.3 and run pnpm install first.'
    }

    Push-Location -LiteralPath $script:ProjectRoot
    try {
        & $pnpmCommand.Source @CommandArguments
        if ($LASTEXITCODE -ne 0) {
            $failure = New-Object System.Exception("pnpm exited with code $LASTEXITCODE.")
            $failure.Data['ExitCode'] = $LASTEXITCODE
            throw $failure
        }
    }
    finally {
        Pop-Location
    }
}

function Exit-ProjectScriptWithError {
    param([Parameter(Mandatory = $true)]$Failure)
    Write-Host $Failure.Exception.Message -ForegroundColor Red
    if ($Failure.Exception.Data.Contains('ExitCode')) {
        exit ([int]$Failure.Exception.Data['ExitCode'])
    }
    exit 1
}
