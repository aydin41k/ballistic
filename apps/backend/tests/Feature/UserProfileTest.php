<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_profile(): void
    {
        $user = User::factory()->create([
            'bio' => 'Test bio',
            'avatar_url' => 'https://example.com/avatar.jpg',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => $user->name,
                'email' => $user->email,
                'bio' => 'Test bio',
                'avatar_url' => 'https://example.com/avatar.jpg',
            ]);
    }

    public function test_user_can_update_bio(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'bio' => 'My new bio',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'bio' => 'My new bio',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'bio' => 'My new bio',
        ]);
    }

    public function test_user_can_update_avatar_url(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => 'https://example.com/new-avatar.png',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'avatar_url' => 'https://example.com/new-avatar.png',
            ]);
    }

    public function test_user_can_upload_avatar_from_device(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/api/user/avatar', [
                'avatar' => UploadedFile::fake()->image('profile.jpg', 512, 512),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('data.id', (string) $user->id)
            ->assertJsonPath(
                'data.avatar_url',
                fn (mixed $value): bool => is_string($value)
                    && str_contains($value, "/storage/avatars/{$user->id}/")
            );

        $storedPath = str_replace('/storage/', '', (string) parse_url(
            (string) $response->json('data.avatar_url'),
            PHP_URL_PATH
        ));
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_uploading_avatar_replaces_managed_previous_file(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $oldPath = "avatars/{$user->id}/old.jpg";
        Storage::disk('public')->put($oldPath, 'old');
        $user->forceFill(['avatar_url' => url("/storage/{$oldPath}")])->save();

        $response = $this->actingAs($user)
            ->post('/api/user/avatar', [
                'avatar' => UploadedFile::fake()->image('replacement.png', 320, 320),
            ], ['Accept' => 'application/json']);

        $response->assertOk();
        Storage::disk('public')->assertMissing($oldPath);
    }

    public function test_uploading_avatar_does_not_delete_another_users_managed_file(): void
    {
        Storage::fake('public');
        $otherUser = User::factory()->create();
        $otherPath = "avatars/{$otherUser->id}/profile.jpg";
        Storage::disk('public')->put($otherPath, 'other');
        $user = User::factory()->create([
            'avatar_url' => url("/storage/{$otherPath}"),
        ]);

        $this->actingAs($user)
            ->post('/api/user/avatar', [
                'avatar' => UploadedFile::fake()->image('replacement.jpg', 320, 320),
            ], ['Accept' => 'application/json'])
            ->assertOk();

        Storage::disk('public')->assertExists($otherPath);
    }

    public function test_avatar_upload_validates_image_type_and_dimensions(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/api/user/avatar', [
                'avatar' => UploadedFile::fake()->create('profile.txt', 20, 'text/plain'),
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['avatar']);

        $this->actingAs($user)
            ->post('/api/user/avatar', [
                'avatar' => UploadedFile::fake()->image('tiny.jpg', 32, 32),
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['avatar']);
    }

    public function test_avatar_upload_requires_authentication(): void
    {
        $this->post('/api/user/avatar', [
            'avatar' => UploadedFile::fake()->image('profile.jpg', 256, 256),
        ], ['Accept' => 'application/json'])->assertUnauthorized();
    }

    public function test_bio_cannot_exceed_500_characters(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'bio' => str_repeat('a', 501),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bio']);
    }

    public function test_avatar_url_must_be_valid_url(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => 'not-a-url',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar_url']);
    }

    public function test_user_can_clear_bio_and_avatar(): void
    {
        $user = User::factory()->create([
            'bio' => 'Old bio',
            'avatar_url' => 'https://example.com/old.jpg',
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'bio' => null,
                'avatar_url' => null,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'bio' => null,
                'avatar_url' => null,
            ]);
    }

    public function test_profile_update_via_patch_includes_new_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson('/api/user', [
                'bio' => 'Patch bio',
                'avatar_url' => 'https://example.com/patch.jpg',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'bio' => 'Patch bio',
                'avatar_url' => 'https://example.com/patch.jpg',
            ]);
    }

    public function test_email_change_resets_verification(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $newEmail = 'newemail'.time().'@example.com';

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'name' => $user->name,
                'email' => $newEmail,
            ]);

        $response->assertStatus(200);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_profile_update_requires_authentication(): void
    {
        $response = $this->putJson('/api/user/profile', [
            'name' => 'Test',
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(401);
    }
}
