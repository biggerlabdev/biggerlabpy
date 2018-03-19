# -*- coding: utf-8 -*-
import mcpi.minecraft as minecraft
mc = minecraft.Minecraft.create(address = "127.0.0.1", port = 4711) 
myId = mc.getPlayerEntityId("test_biggerlab")
pos = mc.entity.getTilePos(myId)
mc.postToChat("Hello Minecraft World")
# Welcome to BiggerLab's Minecraft Python Editor