<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin';

    protected $description = 'Buat akun admin (atau ganti kata sandinya) untuk email di ADMIN_EMAIL';

    private const MIN_LENGTH = 12;

    public function handle(): int
    {
        $email = config('logbook.admin_email');

        if (! is_string($email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $this->error('ADMIN_EMAIL belum diisi atau tidak valid. Isi dulu di file .env.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Kata sandi untuk '.$email.' (minimal '.self::MIN_LENGTH.' karakter)');

        if (mb_strlen($password) < self::MIN_LENGTH) {
            $this->error('Kata sandi terlalu pendek.');

            return self::FAILURE;
        }

        if ((string) $this->secret('Ulangi kata sandi') !== $password) {
            $this->error('Kata sandi tidak sama.');

            return self::FAILURE;
        }

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            ['name' => 'Admin', 'password' => $password],
        );

        $this->info($user->wasRecentlyCreated
            ? "Akun admin {$email} dibuat. Login di /admin."
            : "Kata sandi admin {$email} diganti.");

        return self::SUCCESS;
    }
}
