<?php

namespace Tests\Feature;

use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_the_admin_from_admin_email(): void
    {
        config(['logbook.admin_email' => 'aku@example.com']);

        $this->artisan('app:create-admin')
            ->expectsQuestion('Kata sandi untuk aku@example.com (minimal 12 karakter)', 'jalan-jalan-terus')
            ->expectsQuestion('Ulangi kata sandi', 'jalan-jalan-terus')
            ->assertSuccessful();

        $user = User::query()->where('email', 'aku@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('jalan-jalan-terus', $user['password']));
        $this->assertTrue($user->canAccessPanel(Filament::getPanel('admin')));
    }

    public function test_fails_without_admin_email(): void
    {
        config(['logbook.admin_email' => null]);

        $this->artisan('app:create-admin')->assertFailed();
        $this->assertSame(0, User::query()->count());
    }

    public function test_rejects_short_or_mismatched_passwords(): void
    {
        config(['logbook.admin_email' => 'aku@example.com']);

        $this->artisan('app:create-admin')
            ->expectsQuestion('Kata sandi untuk aku@example.com (minimal 12 karakter)', 'pendek')
            ->assertFailed();

        $this->artisan('app:create-admin')
            ->expectsQuestion('Kata sandi untuk aku@example.com (minimal 12 karakter)', 'jalan-jalan-terus')
            ->expectsQuestion('Ulangi kata sandi', 'jalan-jalan-lagi')
            ->assertFailed();

        $this->assertSame(0, User::query()->count());
    }

    public function test_only_the_admin_email_can_enter_the_panel(): void
    {
        config(['logbook.admin_email' => 'aku@example.com']);
        $other = User::factory()->create(['email' => 'orang@example.com']);

        $this->assertFalse($other->canAccessPanel(Filament::getPanel('admin')));
        $this->actingAs($other)->get('/admin')->assertForbidden();
    }
}
