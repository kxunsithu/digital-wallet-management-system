<?php

namespace App\Console\Commands;

use App\Models\ExternalSystem;
use App\Models\Image;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class StorageSync extends Command
{
    protected $signature = 'storage:sync
        {--source-url= : Base URL to fetch missing files from, e.g. https://smart-wallet-api-vm58.onrender.com}';

    protected $description = 'Download every image referenced in the database into the local public storage disk.';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $baseDir = $disk->path('');

        $paths = collect();

        Image::query()->pluck('image_path')->each(function ($path) use ($paths) {
            if (is_string($path) && $path !== '') {
                $paths->push($path);
            }
        });

        ExternalSystem::query()->pluck('system_logo')->each(function ($path) use ($paths) {
            if (is_string($path) && $path !== '') {
                $paths->push($path);
            }
        });

        $paths = $paths->unique()->values();

        if ($paths->isEmpty()) {
            $this->info('No images referenced in the database.');

            return self::SUCCESS;
        }

        $sourceUrl = rtrim((string) ($this->option('source-url') ?: config('app.url')), '/');

        $downloaded = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($paths as $path) {
            if ($disk->exists($path)) {
                $this->line("  [skip] already on disk: {$path}");
                $skipped++;
                continue;
            }

            $url = $sourceUrl . '/storage/' . $path;

            try {
                $response = Http::timeout(30)->get($url);

                if (! $response->successful()) {
                    $this->warn("  [fail] HTTP {$response->status()} for {$url}");
                    $failed++;
                    continue;
                }

                $target = $baseDir . '/' . $path;
                $dir = dirname($target);
                if (! is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                file_put_contents($target, $response->body());

                $this->line("  [ok]   downloaded: {$path}");
                $downloaded++;
            } catch (\Throwable $e) {
                $this->warn("  [fail] {$url} — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Done. downloaded={$downloaded} skipped={$skipped} failed={$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
