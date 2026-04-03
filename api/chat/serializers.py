from rest_framework import serializers
from django.utils import timezone

from .models import Connection, User, Message

class SignUpSerializer(serializers.ModelSerializer):
    code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'email',
            'code',
            'username',
            'first_name',
            'last_name',
            'password'
        ]
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def create(self, validated_data):
        email = validated_data.get('email').lower()
        code = validated_data.pop('code', None)

        if code:
            try:
                temp_user = User.objects.get(email=email)
                if temp_user.verification_code != code:
                    raise serializers.ValidationError({'code': 'Invalid verification code'})
                if temp_user.code_expiry and temp_user.code_expiry < timezone.now():
                    raise serializers.ValidationError({'code': 'Verification code expired'})
            except User.DoesNotExist:
                raise serializers.ValidationError({'email': 'Email not found'})

        username = validated_data.get('username').lower()
        first_name = validated_data.get('first_name').lower()
        last_name = validated_data.get('last_name').lower()
        
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            email_verified=True
        )
        password = validated_data['password']
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username',
            'name',
            'thumbnail'
        ]

    def get_name(self, obj):
        fname = obj.first_name.capitalize()
        lname = obj.last_name.capitalize()
        return fname + ' ' + lname

class SearchSerializer(UserSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username',
            'name',
            'thumbnail',
            'status'
        ]

    def get_status(self, obj):
        if obj.pending_them:
            return 'pending-them'

        elif obj.pending_me:
            return 'pending-me'

        elif obj.connected:
            return 'connected'

        return 'no-connection'

class RequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer()
    receiver = UserSerializer()

    class Meta:
        model = Connection
        fields = [
            'id',
            'sender',
            'receiver',
            'created'
        ]

class FriendSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = [
            'id',
            'friend',
            'preview',
            'updated'
        ]

    def get_friend(self, obj):
        # If I'm the sender
        if self.context['user'] == obj.sender:
            return UserSerializer(obj.receiver).data

        # If I'm the receiver
        elif self.context['user'] == obj.receiver:
            return UserSerializer(obj.sender).data

        else:
            print('Error: No user found in friend serializer')

    def get_preview(self, obj):
        if not hasattr(obj, 'latest_text'):
            return 'New connection'
        return obj.latest_text

    def get_updated(self, obj):
        if not hasattr(obj, 'latest_created'):
            date = obj.updated
        else:
            date = obj.latest_created or obj.updated
        
        return date.isoformat()


class MessageSerializer(serializers.ModelSerializer):
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'text'
            'created',
            'is_me'
        ]
    
    def get_is_me(self, obj):
        return self.context['user'] == obj.user
