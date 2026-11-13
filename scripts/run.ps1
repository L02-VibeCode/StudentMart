# Accept GNU-style flags exactly as documented, including in Windows PowerShell 5.1.
$runArguments = @($args)
. "$PSScriptRoot/common.ps1"

if ($runArguments.Count -gt 1) {
    Write-Host 'Choose only one mode: --frontend or --backend. Omit flags to run both.'
    exit 2
}

$mode = if ($runArguments.Count -eq 0) { '' } else { $runArguments[0] }
try {
    switch ($mode) {
        ''           { Invoke-ProjectPnpm -CommandArguments @('run', 'dev') }
        '--frontend' { Invoke-ProjectPnpm -CommandArguments @('run', 'dev:mobile') }
        '--backend'  { Invoke-ProjectPnpm -CommandArguments @('run', 'dev:backend') }
        '--help'     {
            Write-Host 'Usage: .\scripts\run.ps1 [--frontend | --backend]'
            Write-Host 'No flags: run Expo and NestJS together. Ctrl+C stops the development servers.'
        }
        default {
            Write-Host "Unknown option: $mode. Use --frontend, --backend, or --help."
            exit 2
        }
    }
    exit 0
}
catch {
    Exit-ProjectScriptWithError $_
}
