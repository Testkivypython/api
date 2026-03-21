import base64
import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.files.base import ContentFile
from django.db.models import Q, Exists, OuterRef
from django.db.models.functions import Coalesce

from .models import User, Connection, Message

from .serializers import ( 
    UserSerializer, 
    SearchSerializer, 
    RequestSerializer, 
    FriendSerializer,
    MessageSerializer
)

class ChatConsumer(WebsocketConsumer):

    def connect(self):
        user = self.scope['user']
        print(user, user.is_authenticated)

        if not user.is_authenticated:
            return
        # Save username to use as a gropu name for this user
        self.username = user.username
        
        # Join this user to a group with their username
        async_to_sync(self.channel_layer.group_add)(
            self.username,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave the group
        async_to_sync(self.channel_layer.group_discard)(
            self.username,
            self.channel_name
        )

    # -------------------------------
    #         Handle request
    # -------------------------------

    def receive(self, text_data):
        #Receive message from websocket
        data = json.loads(text_data)
        data_source = data.get('source')

        # Pretty print   python dict
        print('receive: ', json.dumps(data, indent=2))
         
        # Get friend list
        if data_source == 'friend.list':
            self.receive_friend_list(data)

        # Message list
        elif data_source == 'message.list': 
            self.receive_message_list(data)

        # Message has been sent
        elif data_source == 'message.send':
            self.receive_message_send(data)

        # Request connected (accept)
        elif data_source == 'request.accept':
            self.receive_request_accept(data)

        # Request connected
        elif data_source == 'request.connect':
            self.receive_request_connect(data)

        # Request list 
        elif data_source == 'request.list':
            self.receive_request_list(data)

        # Search users
        elif data_source == 'search':
            self.receive_search(data)
        
        # Thumbnail upload
        elif data_source == 'thumbnail':
            self.receive_thumbnail(data)

    def receive_friend_list(self, data):
        user = self.scope['user']
        # Latest message subquery
        latest_message = Message.objects.filter(OuterRef('id')).order_by('-created')[:1]
        # Get all connections
        connections = Connection.objects.filter(Q(receiver=user) | Q(sender=user), accepted=True)
        
        # Serialize connections
        serialized = FriendSerializer(
            connections, 
            context={ 'user': user }, 
            many=True
        ).annotate(
            latest_text    = latest_message.values('text'), 
            latest_created = latest_message.values('created')
        ).order_by(
            Coalesce('latest_created', 'updated').desc()
        )
        # Send back to sender
        self.send_group(user.username, 'friend.list', serialized.data)

    def receive_message_list(self, data):
        user = self.scope['user']
        connectionID = data.get('connectionID')
        page = data.get('page')

        try: 
            connection = Connection.objects.get(id=connectionID)
        except Connection.DoesNotExist:
            print('Error: Connection not found')
            return

        # Get messages
        messages = Message.objects.filter(connection=connection).order_by('-created')
        # serialize messages
        serialized_message = MessageSerializer(messages, context={ 'user': user }, many=True)

        # get recipient friend
        recipient = connection.sender
        if connection.sender == user:
            recipient = connection.receiver
        
        # Serialize recipient friend
        serialized_friend = UserSerializer(recipient)

        data = {
            'messages': serialized_message.data,
            'friend': serialized_friend.data
        }
        #Send back to the requestor
        self.send_group(user.username, 'message.list', data)

    def receive_message_send(self, data):
        user = self.scope['user']
        connectionID = data.get('connectionID')
        message_text = data.get('message')

        try: 
            connection = Connection.objects.get(id=connectionID)
        except Connection.DoesNotExist:
            print('Error: Connection not found')
            return       

        message = Message.objects.create(
            connection=connection,
            user=user,
            text=message_text
        )

        # get recipient friend
        recipient = connection.sender
        if connection.sender == user:
            recipient = connection.receiver

        # Send new message back to sender
        serialized_message = MessageSerializer(message, context={ 'user': user })
        serialized_friend = UserSerializer(recipient)
        data = {
            'messages': serialized_message.data,
            'friend': serialized_friend.data
        }
        self.send_group(user.username, 'message.send', data)

        # Send new message to receiver
        serialized_message = MessageSerializer(message, context={ 'user': recipient })
        serialized_friend = UserSerializer(user)
        data = {
            'messages': serialized_message.data,
            'friend': serialized_friend.data
        }
        self.send_group(recipient.username, 'message.send', data)

    def receive_request_accept(self, data):
        username = data.get('username')

        # Fetch  connection object
        try:
            connection = Connection.objects.get(sender__username=username, receiver=self.scope['user'])
        
        except Connection.DoesNotExist:
            print('Error: Connection not found')
            return

        # Update connections
        connection.accepted = True
        connection.save()

        # Serialize connections
        serialized = RequestSerializer(connection)

        # Send back to users
        self.send_group(connection.sender.username, 'request.accept', serialized.data)
        self.send_group(connection.receiver.username, 'request.accept', serialized.data)

        # Send new friend object to the sender
        serialized_friend = FriendSerializer(connection, constext={ 'user': connection.sender })
        self.send_group(connection.sender.username, 'friend.new', serialized_friend.data)

        # Send new friend object to the receiver
        serialized_friend = FriendSerializer(connection, constext={ 'user': connection.receiver })
        self.send_group(connection.receiver.username, 'friend.new', serialized_friend.data)

    def receive_request_list(self, data):
        user = self.scope['user']

        # Get all connections
        connections = Connection.objects.filter(receiver=user, accepted=False)
        
        # Serialize connections
        serialized = RequestSerializer(connections, many=True)
        # Send back to sender
        self.send_group(user.username, 'request.list', serialized.data)

    def receive_request_connect(self, data):
        username = data.get('username')
        # Get username from user
        try:
            receiver = User.objects.get(username=username)
        except User.DoesNotExist:
            print('Error: User not found')
            return
        # Create Connection
        connection, _ = Connection.objects.get_or_create(
            sender=self.scope['user'],
            receiver=receiver
        )
        #Serialize Connection
        serialized = RequestSerializer(connection)

        # Send back to sender
        self.send_group(connection.sender.username, 'request.connect', serialized.data)

        # Send to receiver
        self.send_group(connection.receiver.username, 'request.connect', serialized.data)
        

    def receive_search(self, data):
        query = data.get('query')
        # Get users from query search term
        users = User.objects.filter(
            Q(username__istartswith=query) | 
            Q(first_name__istartswith=query) | 
            Q(last_name__istartswith=query)
        ).exclude(
            username=self.username
        ).annotate(
            pending_them=Exists(
                Connection.objects.filter(
                    sender=self.scope['user'],
                    receiver=OuterRef('id'),
                    accepted=False
                )
            ),
            pending_me=Exists(
                Connection.objects.filter(
                    sender=OuterRef('id'),
                    receiver=self.scope['user'],
                    accepted=False
                )
            ),
            connected=Exists(
                Connection.objects.filter(
                    Q(sender=self.scope['user'], receiver=OuterRef('id')) |
                    Q(sender=OuterRef('id'), receiver=self.scope['user']),
                    accepted=True
                )
            )
        )
        # serialize results
        serilized = SearchSerializer(users, many=True)
        # send results
        self.send_group(self.username, 'search', serilized.data)

    def receive_thumbnail(self, data):
        user = self.scope['user']
        # convert base64 data to file
        image_str = data.get('base64')
        image = ContentFile(base64.b64decode(image_str))
        # update thumbnail field
        filename = data.get('filename')
        user.thumbnail.save(filename, image, save=True)
        # Serialize user
        serialized = UserSerializer(user)
        # Send updates user data including new thumbnail
        self.send_group(self.username, 'thumbnail', serialized.data)


    # -------------------------------
    # Catch/all broadcast to clients
    # -------------------------------

    def send_group(self, group, source, data):
        response = {
            'type': 'broadcast_group',
            'source': source,
            'data': data
        }
        async_to_sync(self.channel_layer.group_send)(
            group,
            response
        )

    def broadcast_group(self, data):
        '''
        data: 
            - type: broadcast_group
            - source: where it originated from
            - data: data to send
        '''
        data.pop('type')
        '''
        return data:
            - source: where it originated from
            - data: data to send
        '''
        self.send(text_data=json.dumps(data))
